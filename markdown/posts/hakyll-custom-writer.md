---
title: Using custom Pandoc writers with Hakyll
date: "2015-03-16"
length: 5 minute
comments: true
---

For the past few years, I've used [Octopress](http://octopress.org/) to maintain a small[^1] Github-pages blog about math. However, getting LaTeX and Markdown to coexist peacefully was a hassle that consumed a night or two, and Octopress seemed more feature-rich than I needed. So recently, I decided to switch to [Hakyll](http://jaspervdj.be/hakyll/), a static site generator written in Haskell. Hakyll is powered by [Pandoc](http://johnmacfarlane.net/pandoc/), which has an awesome Markdown parser with built-in support for math. Also I convinced myself I knew enough Haskell that it would be an easy transition[^2].

I wanted to display footnotes to the right of where they are mentioned, like in Edward Tufte's books[^3]. Pandoc works by parsing different formats into a common format (a "Pandoc"), which it can then write into a number of different outputs, like HTML, Markdown, or a LaTeX document. My original plan of modifying Pandoc's [HTML writer](https://github.com/jgm/pandoc/blob/master/src/Text/Pandoc/Writers/HTML.hs) didn't work[^4], but I learned that Pandoc supports [custom writers](http://stackoverflow.com/questions/15939425/is-it-possible-to-write-a-custom-converter-for-pandoc) written in Lua. I managed to write a [lua script](https://github.com/wetmore/personal-site/blob/master/sidenote.lua) which could output the necessary HTML for my sidenotes, but then I needed to get it working with Hakyll, which I thought would be pretty simple.

Anyway, after a wonderful week of learning how monads actually work[^5] I managed to figure it out. So if you'd like to use a custom writer for Pandoc with Hakyll, here's how. In `site.hs`, or whatever your main Hakyll file is, add a new function:

````haskell
customWriterCompilerWith :: (WriterOptions -> Pandoc -> IO String)
                         -> ReaderOptions -> WriterOptions
                         -> Compiler (Item String)
customWriterCompilerWith customWriter ropt wopt = do
    pandoc <- readPandocWith ropt <$> getResourceBody
    withItemBody (unsafeCompiler . customWriter wopt) pandoc
````

This gives us a new Pandoc compiler after we pass it a custom Pandoc writer created with `writeCustom`[^6]. We can use it like so:

````haskell
sidenoteCompilerWith :: ReaderOptions -> WriterOptions -> Compiler (Item String)
sidenoteCompilerWith = customWriterCompilerWith $ writeCustom "sidenote.lua"
````

Now we can use `sidenoteCompilerWith` to define a compiler we can use in our route definitions, by passing reader and writer options.

## How it works

Hakyll's `unsafeCompiler`, which is used elsewhere to allow you to use arbitrary unix programs as compilers, does the heavy lifting here, by fixing the first stumbling block when trying to use a custom writer: the other Pandoc writers Hakyll uses have type `WriterOptions -> Pandoc -> String`{.haskell}, but check out the type for a custom writer:

````haskell
writeCustom "sidenote.lua" :: WriterOptions -> Pandoc -> IO String
````

Since the behaviour of the writer comes from a file which Pandoc first needs to open and read, the resulting custom writer is tainted with the impurity of `IO`{.haskell}. So we live dangerously and invoke the `unsafeCompiler`, of type `IO a -> Compiler a`{.haskell}, so that the composition `unsafeCompiler . customWriter wopt` takes in a `Pandoc`{.haskell} (the AST[^7] from a parsed document) and gives us back a `Compiler String`{.haskell}. However, when Hakyll passes around data such as the Markdown file containing a post, or the resulting `Pandoc`{.haskell} representation of a post, it does so with a functor `Item`{.haskell}, which carries a unique identifier for the data as it changes representations. So we need to lift our function to something of type `Item Pandoc -> Compiler (Item String)`{.haskell}

The Hakyll function `withItemBody` is just the function we need for this; as you can see in the definition of `customWriterCompilerWith` above, we use this function to process the parsed `Item Pandoc`{.haskell} we're given and generate output from our custom writer.

## Acknowledgments

Thanks to [Dom Charley-Roy](https://twitter.com/jokeofweek) for proofreading this post.

[^1]: Literally two posts about math.

[^2]: I do not.

[^3]: [See here](http://www.edwardtufte.com/bboard/images/0001Zi-1676.gif) for an example.

[^4]: Told you I don't know Haskell

[^5]: Beyond "A monad is just a monoid in the category of endofunctors".

[^6]: This is part of the Pandoc API; [here](https://hackage.haskell.org/package/pandoc-1.13.2/docs/Text-Pandoc-Writers-Custom.html) are the docs and [here](https://github.com/jgm/pandoc/blob/master/src/Text/Pandoc/Writers/Custom.hs) is where it's defined

[^7]: Abstract Syntax Tree

