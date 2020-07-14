---
title: $n$ choose $k$ the Haskell way
date: "2015-03-17"
length: 5 minute
comments: true
---

[Binomial coefficients](http://en.wikipedia.org/wiki/Binomial_coefficient) are a surprisingly interesting subject of study, so interesting in fact that Sherlock Holmes' arch-enemy Professor Moriarty began his career with a paper on them. Incidentally, this fictional _[Treatise on the Binomial Theorem](http://en.wikipedia.org/wiki/A_Treatise_on_the_Binomial_Theorem)_ has a longer Wikipedia page than any real work of mathematics I'll ever write. But I digress. Today we're going to look at a novel way to calculate binomial coefficients in Haskell, the programming language that is basically math.

The binomial coefficients $n \choose k$ draw their name from the following "Binomial formula":
$$
(1 + x)^n = \sum_{k = 0}^n {n \choose k} x^k
$$

Here $n \choose k$ is the coefficient on the $k$th power of $x$ in the expansion of the left-hand side. However, a "purer" definition of $n \choose k$ is the combinatorial one: the number of ways to choose $k$ objects from a set of $n$. From this definition one can see why these numbers show up as the coefficients above[^1]. We can also use this point of view to understand some other binomial sum identities -- for example, for a finite set $A$ with $n$ elements, the cardinality of the power set $\mathcal P(A)$ (the set of all subsets of $A$) is $2^n$. This gives a way to understand why
$$
2^n = \sum_{k=0}^n {n \choose k}
$$

which we can of course derive from the binomial formula above but whatever. For each $k$ with $0 \leq k \leq n$, there are $n \choose k$ ways to specify a distinct set of $k$ elements, i.e. a subset of size $k$. So the number of subsets of any size is just the sum of these numbers over all possible $k$, and there are $2^n$ total subsets[^2]. 

Another nice identity is this one:
$$
{n \choose k} = \frac{n}{k}{n-1 \choose k-1}
$$

Combinatorially we can understand it like so: to count the number of ways to pick $k$ elements from a set of $n$ elements, pick one of the $n$ elements and look at the number of ways to pick the other $k-1$ elements from the remaining $n-1$ elements. There are $n$ ways to pick the first element, so that's $n{n-1 \choose k-1}$ ways of picking subsets. But we overcounted -- each subset is counted $k$ times, one time for each of its elements that we pick first. So after dividing by $k$ to fix this, we've shown the identity holds.

The identity is so nice because it gives a natural recursive algorithm to compute the coefficients; just keep applying the identity to get
$$
{n \choose k} = \frac{n}{k}\cdot\frac{n-1}{k-1}\cdots\frac{n-k+1}{1}{n-k\choose 0}
$$

where ${n - k \choose 0} = 1$. And since this is a post about $n \choose k$ in Haskell, I'm going to turn this into a recursive Haskell function right? Unfortunately someone [beat me to it](http://math.stackexchange.com/a/927064/71852), and they even used more identities than I have, so let's take a different approach and go back to the Binomial formula. If we can expand the polynomial $(1 + x)^n$ into a sum, we can just read off the coefficients for each power of $x$. Easy right?

A polynomial only has finitely-many powers of $x$, so we can represent a polynomial such as $a_0 + a_1x + a_2x^2 + \ldots + a_nx^n$ as a list $[a_0, \ldots, a_n]$. In Haskell, we use the typeclass `Num`{.haskell} to describe things that we can add, multiply, negate, and so on; polynomials can do these things too, so let's define a `Num`{.haskell} instance for lists of `a`s, where `a` is an instance of `Num`{.haskell}, representing polynomials with coefficients in `a`:

````haskell
instance Num a => Num [a] where
  fromInteger n = [fromInteger n]
  (x:xs) + (y:ys) = (x + y) : (xs + ys)
  xs + [] = xs
  [] + ys = ys
  (x:xs) * (y:ys) = (x*y) : ([x] * ys + xs * (y:ys))
  _ * _ = []
````

This is missing a few `Num`{.haskell} functions, but we won't need them[^3]. We add two polynomials by adding the respective coefficients for each power of $x$, and the rather complicated expression for multiplication can be derived without much work[^4].

So now $[1,1]$ is our representation for $1 + x$. Exponentiation comes for free since Haskell implements it using [repeated squaring](http://en.wikipedia.org/wiki/Exponentiation_by_squaring). So if we try it out, `[1,1]^2 == [1,2,1]`{.haskell}, and `[1,1]^4 == [1,4,6,4,1]`{.haskell}. Translating these back to math world, $(1+x)^2 = 1 + 2x + x^2$ and $(1+x)^4 = 1 + 4x + 6x^2 + 4x^3 + x^4$. So now it's only natural to define $n \choose k$ by:

````haskell
choose :: Int -> Int -> Int
choose n k = ([1,1]^n) !! k
````

where `xs !! k` is the $k$th element of `xs`. Now we may quickly concoct some quality coefficients:

````haskell
3 `choose` 2 == 3
10 `choose` 6 == 210
434 `choose` 87 == 4614992264942942144
```` 

or just generate an infinite Pascal's triangle with `map ([1,1]^) [0..]`{.haskell}.

````haskell
[[1]
,[1,1]
,[1,2,1]
,[1,3,3,1]
,[1,4,6,4,1]
,[1,5,10,10,5,1]
,[1,6,15,20,15,6,1]
,[1,7,21,35,35,21,7,1]
,[1,8,28,56,70,56,28,8,1]
,[1,9,36,84,126,126,84,36,9,1]
, ...
````

This is honestly an absurd[^5] way to calculate binomial coefficients, but the underlying concept of manipulating polynomials as lists is very cool. We can take this in more directions, such as using infinite streams to represent power series, but perhaps that is a topic for a later post.

## Acknowledgments

Thanks to [Ira Kones](//www.github.com/irakones) and Rory Bokser for proofreading this post.


[^1]: When multiplying out $(1+x)^n$, for each of the $n$ clauses $(1 + x)$ we have
  $n \choose k$ ways of choosing $k$ of the $x$'s to get $x^k$

[^2]: If you're wondering how we knew the number of subsets in the first place,
  note that each subset $S \subseteq A$ can be identified with a function
  $\chi_S : A \to \{0,1\}$, where $\chi_S(a) = 1$ if and only if $a \in S$, and
  there are $2^n$ such functions by a simple counting argument.

[^3]: You can disable warnings for this by passing `ghc` the flag `-fno-warn-missing-methods`.

[^4]: Let $B = (b_0 + b_1x\ldots)$. Then $(a_0 + a_1x\ldots)\cdot B$
  $= \;a_0B + (a_1x\ldots)B$
  $= \;a_0b_0 + a_0(b_1x\ldots) + a_1xB$
  $= \;a_0b_0 + x[a_0(b_1\ldots) + a_1B]$

[^5]: Which is why I like it so much.