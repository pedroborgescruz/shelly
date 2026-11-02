---
id: 1
chapter: orientation
title: Orientation
description: Where am I, and what is here?
prompt: "Find out where you are with `pwd`, then list what is around you with `ls`."
success: "That is the whole orientation ritual: `pwd` for where, `ls` for what. You will type these thousands of times."
focus:
  pwd: print the current directory
  ls: list directory contents (try -a and -l)
hints:
  - "Both commands work with no arguments at all. Type one, press Enter, read the answer."
  - "`pwd` first — it answers *where*. Then `ls` — it answers *what*."
---

A shell session always sits **somewhere**. Every relative path you type
is resolved from that one place, so knowing it is the difference between a
command that works and one that quietly does the wrong thing.

Two commands answer the only two questions that matter at the start:

- `pwd` — *print working directory*. Where am I right now?
- `ls` — *list*. What is in here?

`ls` hides anything whose name begins with a dot. Pass `-a` to see those too,
and `-l` for the long listing with permissions and sizes. Flags combine:
`ls -la`.

The pane on the right is the same filesystem drawn as a tree. Use it to check
your mental model against reality — that is exactly what `pwd` and `ls` do at
a real terminal.
