---
id: 23
chapter: pipes
title: Chaining
description: Join small tools into one that does what you need.
prompt: "Print only the `ERROR` lines of `logs/app.log`, using `cat` and `grep` joined by a pipe."
success: "That is the Unix philosophy in one line. Try `cat logs/app.log | grep ERROR | wc -l` to count them instead."
focus:
  grep: keep only matching lines (-i -v -n -c)
  wc: count lines, words, bytes
hints:
  - "Two commands. The first one prints the whole file; the second one throws away the lines you do not want."
  - "`cat logs/app.log` gets you the text. Now hand that text to `grep` instead of to the screen."
  - "The operator between them is `|`, and `grep` takes the pattern as its first argument: `grep ERROR`."
---

`>` redirects output into a *file*. The pipe, `|`, redirects it into
another *command's* standard input:

```
cat logs/app.log | grep ERROR
```

`cat` prints the file; `grep` reads those lines and keeps only the ones matching
`ERROR`. Neither command knows the other exists — that is the whole idea. Small
tools, one job each, composed at the command line.

Useful `grep` flags:

- `-i` ignore case
- `-v` invert: print the lines that do **not** match
- `-n` prefix each hit with its line number
- `-c` print how many lines matched instead of the lines

`grep` can open the file itself (`grep ERROR logs/app.log`), which is one process
instead of two — but the pipe is the pattern worth learning, because the left
side can be any command at all.
