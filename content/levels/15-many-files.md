---
id: 15
chapter: reading
title: Several at once
description: Most commands take more than one file.
prompt: "Print both files in `logs/` with a single `cat`."
success: "Almost every read-only command accepts a list of files. Reaching for a loop is usually a sign you forgot."
focus:
  cat: print one file, or several, back to back
  ls: check what is in there first
hints:
  - "You do not need two commands."
  - "`cat` takes as many filenames as you give it."
  - "`cat logs/app.log logs/access.log`."
---

This is the *concatenate* in `cat`:

```
cat logs/app.log logs/access.log
```

One command, both files, printed in the order you listed them. No separator, no
headers — just one stream of text, which is exactly what the tools in the next
chapter want to be handed.

The same is true almost everywhere: `head a b`, `tail a b`, `wc -l a b`,
`grep pattern a b`. When a command takes a file, it usually takes a list of
them. `head` and `tail` even add a `==> filename <==` banner so you can tell
which output came from which file.

The instinct worth building: **before writing a loop, check whether the command
already accepts a list.** Most of the time it does, and the loop was never
needed.
