---
id: 7
chapter: manipulation
title: Parents at once
description: Build a whole branch with one command.
prompt: "Create the directory `src/lib/utils` using a single `mkdir`."
success: "`-p` means *parents*: create what is missing, say nothing about what already exists."
focus:
  mkdir: create a directory, and with `-p` its missing parents too
hints:
  - "Plain `mkdir` refuses, because the directories in the middle do not exist yet."
  - "There is a flag that tells `mkdir` to build the whole chain."
  - "`mkdir -p src/lib/utils`."
---

`mkdir a/b/c` fails if `a` or `a/b` is missing. The error is honest — it will
not quietly invent directories you did not ask for.

`mkdir -p` flips that: create every missing parent along the way.

```
mkdir -p src/lib/utils
```

`-p` has a second, quieter effect: it stops complaining when the directory
already exists. That is why you see it in scripts — `mkdir -p build` is safe to
run a hundred times, while plain `mkdir build` fails on the second run and takes
the whole script down with it.

The habit: `-p` when you mean *make sure this path exists*, plain `mkdir` when
you mean *this should not exist yet*.
