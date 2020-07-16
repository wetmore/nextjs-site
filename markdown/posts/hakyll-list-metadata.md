---
title: Accessing list metadata in Hakyll
date: "2015-06-27"
length: 5 minute
comments: true
---

Like many static site generators, Hakyll allows you to annotate your files with
metadata, for use in templates. For example, this post is written in Markdown,
and the first lines of the file are

````
---
title: Accessing list metadata in Hakyll
date: 2015-06-26
comments: true
---
````

This looks like [YAML](https://en.wikipedia.org/wiki/YAML)^[YAML Ain't Markup Language],
but Hakyll doesn't actually use YAML. Instead, by default it parses a simpler syntax,
and associates each key to the left of the `:` with the string to the right. This
means that we can't use the nice list syntax included in YAML, for example:

````
tags:
 - haskell
 - programming
 - hakyll
````

However, we can build our own function to parse a simpler syntax: comma-separated, 
single-line lists. While I don't believe it's possible to use the syntax above, 
let's settle for less and add the capability to parse comma-separated lists such as

````
tags: haskell, programming, hakyll
````

## Contexts

Hakyll templates allow us to use dollar-signs ($) to delimit variables which will
be replaced when the templates are compiled. For example, part of this post's
HTML is specified in the template `post.html`, which looks like this:

````html
<div class="main-text">
    $body$
</div>
````

The `$body$` bit is filled in with the contents of the post, after they are compiled
from Markdown. But how does the compiler know what to fill in for `$body$`?

This is where [contexts](http://jaspervdj.be/hakyll/tutorials/04-compilers.html#templates-context)
come in. Contexts hold mappings from strings like `body` to values which will replace
them in templates. All of the special forms between `$`s in Hakyll's template language
derive their meanings from contexts. One such special form is the `$for()$` construct,
which looks like this:

````html
$for(posts)$
    <li>
        <a href="$url$">$title$</a> - $date$
    </li>
$endfor$
````

The type of context entry which allows this to work is the `listField`:

````haskell
listField :: String -> Context a -> Compiler [Item a] -> Context b
````

The `String`{.haskell} is the name of the list used as the argument to `for`. The
`Context a`{.haskell} is the context which is used for the body of the loop - in
the example above, it would be the context providing value for `$url$`, `$title$`,
and `$date$`. Next, the `Compiler [Item a]`{.haskell} is the list of items to iterate
over in the loop.

We will use `listField` to create a list we can iterate over, whose elements are
parsed from metadata.

## Parsing the metadata

The following function will take a context for each item, and a string to use as
the metadata key, and return a context associating that string to a list, parsed
from the metadata.

````haskell
listContextWith :: Context String -> String -> Context a
listContextWith ctx s = listField s ctx $ do
    identifier <- getUnderlying
    metadata <- getMetadata identifier
    let metas = maybe [] (map trim . splitAll ",") $ M.lookup s metadata
    return $ map (\x -> Item (fromFilePath x) x) metas
````

For the most part, this is a copy of the [function](http://jaspervdj.be/hakyll/reference/src/Hakyll-Web-Tags.html#getTags) which parses tags from metadata fields, found in the [Hakyll.Web.Tags](http://jaspervdj.be/hakyll/reference/Hakyll-Web-Tags.html)
module. I'd go on to define

````haskell
listContext :: String -> Context a
listContext = listContextWith defaultContext
````

for convenience.

## Application: adding "scripts" and "styles" fields

The default Hakyll blog uses a template called `default.html`[^2] to wrap all site content in a
consistent look. This template includes the `<head>` and `<body>` tags, so everything
else on the page can't use `<head>` or `<body>`. If you want to include custom
scripts or styling to a particular page, but still keep the consistent look, 
you can't place them in the head.

We can use list metadata to handle this. Add the following wherever you want the
scripts to show up, say in the `<head>` tag of `default.html`:

````html
$if(scripts)$
$for(scripts)$
    <script src="$body$"></script>
$endfor$
$endif$
````

The `$body$` in this case is the contents of the list elements of `scripts`. It
is provided by `defaultContext`.

Now for any page you want to use the `scripts` metadata with, compile it with
the following context included[^3]:

````haskell
headContext = listContext "scripts" <> defaultContext
````

Now we can add the following metadata to any pages we want extra scripts on:

````
---
scripts: /js/custom.js, http://greatlibraryjs.com/source.js
---
````

[^2]: [Here](https://github.com/wetmore/personal-site/blob/master/templates/default.html) is mine.

[^3]: The `<>` is the infix operator for `mappend`, the combining operation for
  monoids. `Context` is an instance of the [`Monoid` typeclass](http://hackage.haskell.org/package/base-4.7.0.1/docs/Data-Monoid.html) - combining two contexts returns a context with fields from both, with the left
  context's fields getting precedence. 