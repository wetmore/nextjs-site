---
title: Parsing the untyped $\lambda$-calculus with Parsec
subtitle: Or, "Parsing combinators with parser combinators"
date: "2015-06-24"
---

The book _Types and Programming Languages_ (briefly, TAPL) is a popular
introduction to type systems and programming language theory. Starting with the
untyped $\lambda$-calculus, TAPL walks the reader through the construction of a simple
expression-based language, focusing on type-checking and evaluation. One of the
first exercises is an evaluator for the untyped $\lambda$-calculus, in OCaml.

I've been working through the book in Haskell, which involves a pretty
straightforward transcription from OCaml to Haskell. While the book gives an
implementation of the evaluator, it doesn't include any discussion of parsing
$\lambda$-expressions such as $\lambda x.\lambda y.x\;y$. Instead, to play around with the evaluator
you must pass it an encoding of the term. That's a real hassle, so let's build a
parser for such expressions.

The heavy lifting for this parser comes courtesy of the Haskell library
[Parsec](https://hackage.haskell.org/package/parsec). Parsec provides a monadic
parsing system, which along with [do notation](https://en.wikibooks.org/wiki/Haskell/do_notation)
provides a nice DSL for parsing. First, let's import what we need:

```haskell
import Text.Parsec
import Text.Parsec.Combinator (between, sepBy1, chainr1)
import Data.List (elemIndex)
```

In TAPL, the format for encoding $\lambda$-terms is prescribed. The usual grammar for
$\lambda$-terms is

$$
M,N ::= x \,|\, \lambda x.M \,|\, M\;N
$$

which is to say, a $\lambda$-term is either a _variable_ $x$, a _$\lambda$-abstraction_ $\lambda
x.M$, or an _application_ of two terms $M\;N$. In Haskell, the associated data
type is given by:

```haskell
data Term =
    TmVar Info Int Int
  | TmAbs Info String Term
  | TmApp Info Term Term
  deriving (Show)

data Info = Info { row :: Int, col :: Int } deriving (Show)
```

`Info`{.haskell} is used to hold row and column information about the terms as they are
parsed, in case such information is necessary for error messages later.

The data constructors `TmAbs`{.haskell} and `TmApp`{.haskell} take predictable arguments - for an
abstraction we track the name of the variable as a string, and an application
stores the two terms involved. But why are there numbers stored in each `TmVar`{.haskell}?

The first number is the _[De Bruijn
index](https://en.wikipedia.org/wiki/De_Bruijn_index)_[^1], which cleverly encodes
the variables in a nameless representation by storing "how far" the variable is
from its binding $\lambda$. The number represents how many other $\lambda$-abstractions (which
can be simply called "binders") there are in the scope of the variable. So, for
example, the identity term $\lambda x.x$ can be written as $\lambda.0$ and our
friend $\lambda x.\lambda y.x\;y$ from before becomes $\lambda.\lambda.1\;0$.
This nameless representation does away with any issues caused by name
collisions; more information about its advantages can be found in the link
above.

In order to calculate a variable's de Bruijn index, we will need to keep track
of a list of bound variables. Hence we will use the following type alias:

```haskell
type BoundContext = [String]
```

The second number in the `TmVar`{.haskell} data constructor stores how many bound
variables are in the variable's scope, and is used as a sanity check in TAPL's
evaluator.

## Munging info

Before we start writing the parser, we'll need a convenience function which will
produce the `Info`{.haskell} we need during parsing. Parsec tracks its position within the
source as it parses with the `SourcePos`{.haskell} type. We will use this to grab the row
and column position:

```haskell
infoFrom :: SourcePos -> Info
infoFrom pos = Info (sourceLine pos) (sourceColumn pos)
```

In order to use this function, we of course need a `SourcePos`{.haskell} to call it on. To
get one of these, we first need to know how building parsers in Parsec works.

## Parser combinators

Parsec parsers are built up by composing a variety of _parser combinators_. A
_combinator_ is technically a function with no free variables, i.e. one
depending only on its arguments; some common examples are the indentity $I
\equiv \lambda x.x$, or the constant function $K \equiv \lambda x.\lambda y. x$.
In the world of functional programming, however, our mental model of a
combinator is not necessarily this definition -- instead, we think of combinators
as simple, self-contained building blocks with which we can construct more
complicated functions. For example, the ["SKI combinator
calculus"](https://en.wikipedia.org/wiki/SKI_combinator_calculus) is a system
which only allows us to work with the combinators $K$ and $I$ above, as well as
the substitution combinator $S \equiv \lambda x.\lambda y.\lambda
z.(x\;z)\;(y\;z)$. We can apply them to each other; for example, $I S = S$. From
these simple combinators we can build much more complex ones; an interesting
example is $S I I$, which takes some input and applies it to itself. In fact,
any expression in the untyped $\lambda$-calculus can be written as a combination of the
$S$,$K$, and $I$ combinators!

This same spirit of complexity via composition drives Parsec. The library
provides some simple parsers, like `letter`, which matches a single letter, or
`char c`, which matches whatever character `c` is. Parsers have the type `Parsec s u a`{.haskell}, which we can break down like so:

- `s` is the type of the input, such as `String`{.haskell}
- `u` is the type of the "user state", i.e. whatever data you want to carry
  around as you parse
- `a` is the type of the parser's output

In our case, we will be parsing `String`{.haskell}s into `Term`{.haskell}s, and we will need to
carry around a context storing which $\lambda$-abstractions we've seen in order to
convert to de Bruijn notation, which will be a list of `String`{.haskell}s as we mentioned
earlier. So our final parser will have type `Parsec String BoundContext Term`{.haskell}.
That's a bit of a mouthful, so lets use a type alias:

```haskell
type LCParser = Parsec String BoundContext Term
```

These basic parsers can be combined into more complex beasts with a number of
provided functions. One of the usual suspects is the infix function `<|>` (which
you may recognize from the [`Alternative`
typeclass](https://hackage.haskell.org/package/base-4.8.0.0/docs/Control-Applicative.html#g:2))
. If `p` and `q` are two parsers, then `p <|> q` is a
parser which tries parsing with `p`, and if that fails, parsing with `q`. So
`letter <|> char '\''` matches either a letter, or a "prime" '.

In fact, this is part of the first building block we will need. We will allow
variables which are strings consisting of letters or primes, such as "x", "y",
"x'", or "lol". The parser for this is

```haskell
parseVarName :: Parsec String u String
parseVarName = many1 $ letter <|> char '\''
```

The stranger here is `many1`, which is a rather predictable function. Given a
parser `p`, `many1 p` will match 1 or more of the things `p` parses. In our
case, this means 1 or more letters or primes - i.e. a string like described
above. Note that the type of the state is left as a variable.

In order to use a parser, we need to run it. Let's give ourselves a helper
function for running the parsers we make as we go:

```haskell
parseWith :: Parsec String [u] a -> String -> Either ParseError a
parseWith p = runParser p [] "untyped lambda-calculus"
```

As the type signature suggests, `parseWith` takes a parser and a string and
either gives you an parsing error, or whatever the output of the parser is. The
empty list we hand it will be used later as the initial state for our parser (an
empty context). The string "untyped lambda-calculus" is used as the source name
when Parsec prints errors.

Here are a few examples of using the variable name parser. Notice what it
accepts and rejects[^2]:

```haskell
parseWith letter "loasdfl"
parseWith parseVarName "4x'"
parseWith parseVarName "x'"
parseWith parseVarName "y 5"
```

```output
Right 'l'

Left "untyped lambda-calculus" (line 1, column 1):
unexpected "4"
expecting letter or "'"

Right "x'"

Right "y"
```

Notice that when the parser hits an invalid character right off the bat, it
fails, because we wanted 1 or more characters. But if it has some valid
characters and hits an invalid one, it stops parsing and returns the good stuff.
Then it can continue trying another parser on the invalid part in more complex
parsers.

## Monadic parsing

The type `Parsec s u`{.haskell}, with the `a` dropped, has kind `* -> *`, i.e. it is a
type constructor, like `Maybe`{.haskell} or `Either a`{.haskell}. Fixing a type for the input and
the user state, `Parsec s u`{.haskell} is a monad. Recall that to make a monad out of a
type constructor `m`, one must provide implementations of functions `return :: a -> m a`{.haskell} and `(>>=) :: m a -> (a -> m b) -> m b`{.haskell}. For Parsec parsers, these
functions work like so:

### `return`

`return x` creates a parser which reads no input, and outputs `x`. For example:

```haskell
parseWith (return "output1") ""
parseWith (return "output2") "This is not read."
```

```output
Right "output1"

Right "output2"
```

### Bind, i.e. `(>>=)`

`p >>= f` runs `p`, then passes the output of parsing with `p` to `f`. Recall
the type signature for `(>>=)`: in this case, `Parsec s u a -> (a -> Parsec s u b) -> Parsec s u b`{.haskell}. So passing the output of parsing with `p` to `f` gives us a
parser, and we run it on the remaining input. Here is a particularly contrived
example:

```haskell
announceLetter c = return $ "The first letter is " ++ [c]
parseWith (letter >>= announceLetter) "abc"
```

```output
Right "The first letter is a"
```

It's worth looking at what `(>>)`{.haskell} does as well, even though it can be derived
from `(>>=)`. `p >> q` is a parser which runs `p` on the input, discards the
result, then runs `q` on the remaining input. So, for example:

```haskell
parseWith (letter >> digit) "r5"
parseWith (parseVarName >> many1 digit) "lol46"
```

```output
Right '5'
Right "46"
```

This is useful when we want to parse pieces of the input which we do not need to
store; for example, if we are parsing IP addresses, there is no need to store
the dots.

A big advantage of this monad instance is that we can use do notation. For
example, here is how we might parse an IP address:

```haskell
data IP = IP Int Int Int Int deriving (Show)

number :: Parsec String u Int
number = many1 digit >>= (return . read)

dot = char '.'

parseIP = do
  p1 <- number
  dot
  p2 <- number
  dot
  p3 <- number
  dot
  p4 <- number
  return $ IP p1 p2 p3 p4

parseWith parseIP "192.168.0.1"
parseWith parseIP "192.168.0"
```

```output
Right (IP 192 168 0 1)

Left "untyped lambda-calculus" (line 1, column 10):
unexpected end of input
expecting digit or "."
```

## Parsing terms

Let's begin building the parsers for the different types of terms. The
abstraction parser is the most involved, and lays the groundwork for the
stateful part of the parsing, so we will start with that.

```haskell
parseAbs :: LCParser -> LCParser
parseAbs termParser = do
  char '\\'
  v <- parseVarName
  modifyState (v :)
  char '.'
  term <- termParser
  modifyState tail
  pos <- getPosition
  return $ TmAbs (infoFrom pos) v term
```

First, we match a backslash, which begins the $\lambda$-abstraction (the
backslash syntax is inspired by Haskell). Next, we parse the subsequent variable
name and store it. As we mentioned before, the state we carry around is a list
of bound variables, so after we see the variable we push it onto the front of
the list using `modifyState`, which applies the given function to the state.
Next we pass by the dot after the variable, and parse the term in the body of
the $\lambda$-abstraction. Note that we haven't defined a parser for general
terms yet; we can define it once we've laid out how to parse each type of term[^3].

After parsing the body term, we pop abstraction's variable off of the context
list, since we are leaving the scope of the abstraction. Having completed the
parsing, we grab the `SourcePos`{.haskell} using `getPosition` and return a `TmAbs`{.haskell} filled
in with all the necessary data we've parsed.

Now let's move on to parsing variables. When we parse a variable, we need to
return a `TmVar`{.haskell} with the correct de Bruijn index. This index is the position of
the variable in the context list, which is the state we store while parsing. If
the variable name isn't found in the list, then it hasn't been bound anywhere
and is free. This provides a small challenge though - what number should we use
for the index of a free variable? In TAPL, the author defines a function for
printing elements of `Term`{.haskell} as normal lambda expressions, but this function has
no support for free variables (printing an error in their presence) so we will
also elide the challenge of indexing and naming free variables by only parsing
terms with no free variables (i.e., combinators). Hence the alternate title for
the post: "Parsing combinators with parser combinators".

Below, we see an implementation for the variable parser:

```haskell
parseVar :: LCParser
parseVar = do
  v <- parseVarName
  list <- getState
  findVar v list

findVar :: String -> BoundContext -> LCParser
findVar v list = case elemIndex v list of
  Nothing -> fail $ "The variable " ++ v ++ " has not been bound"
  Just n  -> do
    pos <- getPosition
    return $ TmVar (infoFrom pos) n (length list)
```

It works as we've discussed: first, we parse a variable name, then grab the
`BoundContext`{.haskell} list from the parser state. The `findVar` function takes the
variable name and list of bound variables, and returns a `TmVar`{.haskell} with the
appropriate index when it can, failing otherwise.

Finally, we need a parser which can handle applications. Now, ideally, once we
had our application parser `parseApp`, we would be able to say something like:

```haskell
parseTerm = parseApp <|> parseAbs <|> parseVar
```

However, this would lead to an infinite loop: the `parseApp` function would make
a call to `parseTerm` for each space-separated term there is in the application.
Moreover, `parseApp` must show up before `parseAbs` in the definition of
`parseTerm`, because otherwise in a case like "$\lambda x.x \; \lambda y.y$"
the abstraction parser would consume the first abstraction, which is awfully
short-sighted because then the parser doesn't see the entire terms as an
application. But this means that when `parseApp` makes its call to `parseTerm`,
it will just repeatedly call `parseApp` over and over again as that is the first
parser it tries when running `parseTerm`.

We can fix this by parsing application terms and non-application terms
separately. When we want to parse an application, we run the non-application
parser on a space-separated series of terms. Since application in the $\lambda$-calculus
is left-associative, we can parse a string like "M N O", where M, N, and O are
terms, as "(M N) O". Parsec includes a function which can help us in this
situation:

```haskell
chainl1 :: Parsec s u a -> Parsec s u (a -> a -> a) -> Parsec s u a
```

Essentially, `chainl1 p q` is a parser which matches 1 or more of whatever `p`
parses, then performs a left fold with the function returned by the `q` parser.
You can see it used in practice in the final part of our parser:

```haskell
parens :: Parsec String u a -> Parsec String u a
parens = between (char '(') (char ')')

parseNonApp :: LCParser
parseNonApp =  parens parseTerm   -- (M)
           <|> parseAbs parseTerm -- $\lambda$x.M
           <|> parseVar           -- x

parseTerm :: LCParser
parseTerm = chainl1 parseNonApp $ do
  space
  pos <- getPosition
  return $ TmApp (infoFrom pos)
```

Notice that we've also added a parser for terms within parentheses. We conclude
by creating a `parse`{.haskell} function:

```haskell
parse :: String -> Either ParseError Term
parse = parseWith parseTerm
```

We can test it out:

```haskell
parse "\\x.\\y.x y"
```

```output
Right
  (TmAbs (Info {row = 1, col = 10}) "x"
    (TmAbs (Info {row = 1, col = 10}) "y"
      (TmApp (Info {row = 1, col = 9})
        (TmVar (Info {row = 1, col = 8}) 1 2)
        (TmVar (Info {row = 1, col = 10}) 0 2)
      )
    )
  )
```

Here is the function from TAPL for printing these terms in a nicer way:

```haskell
data Binding = NameBind deriving (Show)

type Context = [(String, Binding)]

ctxLength :: Context -> Int
ctxLength = length

indexToName :: Context -> Int -> String
indexToName ctx n = fst $ ctx !! n

pickFreshName :: Context -> String -> (Context, String)
pickFreshName ctx x
  | x `elem` (map fst ctx) = pickFreshName ctx $ x ++ "'"
  | otherwise = ((x, NameBind) : ctx , x)

printTm :: Context -> Term -> String
printTm ctx t = case t of
  TmAbs _ x t1 -> let
      (ctx', x') = pickFreshName ctx x
    in "(\\" ++ x' ++ "." ++ (printTm ctx' t1) ++ ")"
  TmApp _ t1 t2 ->
    "(" ++ (printTm ctx t1) ++ " " ++ printTm ctx t2 ++ ")"
  TmVar _ x n ->
    if ctxLength ctx == n then
      indexToName ctx x
    else
      "[bad index]"
```

We can hook this up to our parser to see that it works:

```haskell
printTerm s = case parse s of
  Left err -> print err
  Right t -> print $ printTm [] t

printTerm "\\x.\\y.x y"
printTerm "\\f.(\\x.f (x x)) (\\x.f (x x))" -- Y combinator
```

```output
"(\\x.(\\y.(x y)))"

"(\\f.((\\x.(f (x x))) (\\x.(f (x x)))))"
```

## Coda

Once you get the hang of it, Parsec makes writing parsers pretty fun. The parser
combinator approach seems near-fetishized in the Haskell community; one oft-cited
reason for their greatness is the fact that parser combinators allow us to write
parsers in the host language (Haskell in this case) without needing to write a
specification in some other language (the Yacc/Bison approach[^4]). Having little
experience with parsers myself, I can't attest to this particular strength, but
the fact that I could knock out a small parser in one sitting having never worked
with Parsec before is a testament to its ease of use.

If you would like to see the parser implementation together in one place, instead
of spread throughout this post, you can find it [here](https://github.com/wetmore/TAPL-implementations/blob/master/untyped/Parser.hs).
The parser and evaluator can be found together in [this folder](https://github.com/wetmore/TAPL-implementations/tree/master/untyped).

[^1]:
    _Caveat:_ The Wikipedia article starts numbering at 1, but TAPL (and this post,
  as a result) start numbering at 0. So $\lambda x.x$ is $\lambda.1$ in the
  Wikipedia article, but $\lambda.0$ for our purposes. Thanks [platz](https://news.ycombinator.com/item?id=9781815)
  for pointing this out.

[^2]:
    The result of a call to `parseWith` is `Either ParseError a`{.haskell}. A successful
  parsing attempt will return `Right x`{.haskell}, where `x` is whatever was parsed. If there
  is a parsing error, we get a `Left err`{.haskell} instead, where `err` is a `ParseError`{.haskell}.
  An explanation of what `Left`{.haskell} and `Right`{.haskell} are can be found
  [here](https://hackage.haskell.org/package/base-4.7.0.0/docs/Data-Either.html).

[^3]:
    We take the term parser in as an argument to `parseAbs`{.haskell} so that we can
  develop the parser step-by-step without IHaskell complaining that the term
  parser is undefined. The abstraction parser depends on the term parser and vice
  versa. If this was just in one file, then we could refer to the term parser
  directly.

[^4]:
    Yacc is a _parser generator_, which means you write the grammar for the
  language you want to parse, and Yacc will spit out a parser for such a language
  in C or Java. Bison is the GNU version of Yacc, with a punning name in the GNU
  tradition.
