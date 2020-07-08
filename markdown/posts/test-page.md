---
title: Test Page `code` $\lambda$
date: "2020-01-01"
---

Next.js has two forms of pre-rendering: **Static Generation** and **Server-side Rendering**. The difference is in **when** it generates the HTML for a page.

[Here is a link, internal](/about)

# H1 Test

Yadda yadda yadda

## H2 Test

yadda yadda yadda

yadda yadda

### H3 Test

_This is emphasized_

**This is strong**

Here is some inline math $x = \frac{1}{2}$.

$\lambda$

$$\lambda$$

$$ hi $$

```
def foo(x):
    return x
```

```js
const foo = (x) => x;
```

- **Static Generation** is the pre-rendering method that generates the HTML at **build time**. The pre-rendered HTML is then _reused_ on each request.
- **Server-side Rendering** is the pre-rendering method that generates the HTML on **each request**.

Importantly, Next.js lets you **choose** which pre-rendering form to use for each page. You can create a “hybrid" Next.js app by using Static Generation for most pages and using Server-side Rendering for others.
