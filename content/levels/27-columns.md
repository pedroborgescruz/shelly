---
id: 27
chapter: pipes
title: Columns
description: Pulling one field out of every line.
prompt: "Print just the IP address from each line of `logs/access.log`."
success: "`cut` splits on a delimiter you choose. The default is TAB, which is almost never what you have."
focus:
  cut: pull fields out of each line
  cat: look at the shape of the data first
hints:
  - "`cat logs/access.log` first and look at what separates the fields."
  - "`cut` splits on TAB unless you tell it otherwise — the flag is `-d`."
  - "`cut -d ' ' -f 1 logs/access.log`."
---

Log lines are columns pretending to be prose. `cut` takes them apart:

```
cut -d ' ' -f 1 logs/access.log
```

- `-d` — the **delimiter** to split on. Quote it when it is a space.
- `-f` — which **fields** to keep, counting from 1. Takes a list: `-f 1,3` or
  `-f 2-4`.

The default delimiter is TAB, not space. This is the single most common `cut`
mistake: `cut -f 1 file` on space-separated data prints every line unchanged,
because no line contains a tab, and `cut` passes through lines that lack the
delimiter rather than erroring.

`cut` is strict about delimiters — two spaces in a row mean an empty field
between them. For ragged, human-aligned columns, `awk '{print $1}'` is the
tool, and that arrives in the wrangling chapter.

Look at your data before you cut it. `head -3` costs a second.
