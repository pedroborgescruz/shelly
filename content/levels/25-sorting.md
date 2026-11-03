---
id: 25
chapter: pipes
title: Sorting
description: Order is a prerequisite, not a nicety.
prompt: "Print the contents of `names.txt` in alphabetical order."
success: "`sort` does one job. The reason it matters is what it makes possible next."
focus:
  sort: sort lines of text
  cat: print a file
hints:
  - "One command, one file."
  - "`sort names.txt` — it reads files directly, no pipe required."
---

```
sort names.txt
```

Alphabetical by default. The flags you will actually use:

- `-n` — numeric. Without it, `10` sorts before `9`, because text comparison
  reads character by character.
- `-r` — reverse.
- `-u` — drop duplicates while sorting.
- `-rn` — biggest number first, which is the shape of every "top N" pipeline.

Like most of these tools, `sort` reads files directly *or* standard input, so
both of these work:

```
sort names.txt
cat names.txt | sort
```

The first is one process instead of two. The second matters when the left side
is not a file — which is most of the time in a real pipeline.

Sorting is rarely the goal. It is the step that makes the *next* command
possible, and the next level shows why.
