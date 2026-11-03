---
id: 19
chapter: streams
title: Appending
description: Adding to a file instead of replacing it.
prompt: "Build `todo.txt` so it contains exactly three lines: `buy milk`, `write tests`, `ship it`."
success: "`>` starts a file, `>>` grows it. Mixing them up is how people lose work."
focus:
  echo: print its arguments
  cat: check what actually landed
hints:
  - "Three commands, one line each."
  - "The first can use `>`. The other two must not."
  - "`>` replaces the file every time; `>>` adds to the end."
---

`>` truncates. Every single time.

```
echo buy milk > todo.txt
echo write tests > todo.txt   # todo.txt now contains ONLY "write tests"
```

`>>` appends instead:

```
echo buy milk > todo.txt
echo write tests >> todo.txt
echo ship it >> todo.txt
```

Three lines, in order.

The usual pattern is exactly that: `>` once to start the file fresh, then `>>`
for everything after. Using `>` to start is deliberate — it clears whatever was
there from the last run, so you are not appending to yesterday's output.

`cat todo.txt` between steps costs nothing and tells you the truth. Get in the
habit now, while the files are three lines long and the mistakes are cheap.
