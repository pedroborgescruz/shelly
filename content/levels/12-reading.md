---
id: 12
chapter: reading
title: Reading a file
description: Look inside without opening an editor.
prompt: "Print the contents of `README.md`."
success: "`cat` is the simplest thing in the shell: read this, write it to standard output. Everything in the next two chapters is built on that."
focus:
  cat: print a file's contents
hints:
  - "One command, one argument: the file you want to see."
  - "`cat README.md`."
---

```
cat README.md
```

`cat` is short for *concatenate*. Its real job is joining several files
together — `cat a b c` prints all three, back to back — and printing a single
file is just the one-argument case.

That sounds like trivia, but it explains the name, and it explains why `cat` is
everywhere: it is the standard way to turn *a file on disk* into *a stream of
text*, which is the only thing the rest of the toolkit knows how to work with.

Two details worth having now:

- `cat` with no file argument reads from your keyboard instead. If you ever run
  `cat` alone and the shell seems to hang, it is waiting for you — press
  **Ctrl-D** to end the input.
- `cat -n` numbers the lines, which is handy when something is complaining
  about line 47.

Do not use `cat` on a huge file; it will scroll past faster than you can read.
That is what the next level is for.
