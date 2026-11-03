---
id: 26
chapter: pipes
title: Counting duplicates
description: The most useful two-command pipeline there is.
prompt: "Show how many times each name appears in `names.txt`, using `sort` and `uniq` together."
success: "`sort | uniq -c` turns any list into a tally. You will reach for it more than any other pipeline."
focus:
  sort: sort lines of text
  uniq: collapse repeated adjacent lines
hints:
  - "`uniq` alone will not do it — try it and look at the result."
  - "`uniq` only ever compares a line with the one directly before it."
  - "`sort names.txt | uniq -c`."
---

`uniq` collapses repeated lines — but only **adjacent** ones.

```
cat names.txt | uniq -c      # barely collapses anything
sort names.txt | uniq -c     # a real tally
```

This surprises everyone once. `uniq` does not build a set; it walks the input
once, comparing each line with the previous one, and emits a line when the run
ends. Duplicates scattered through the file never meet, so they are never
collapsed.

That design is deliberate: it means `uniq` needs no memory at all and can
process a file larger than RAM. The cost is that **you** have to put equal lines
next to each other first — which is what `sort` is for.

Hence the idiom, which you should commit to muscle memory:

```
sort | uniq -c
```

`-c` prefixes each line with its count. `-d` shows only lines that repeated;
`-u` only those that did not.
