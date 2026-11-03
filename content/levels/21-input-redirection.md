---
id: 21
chapter: streams
title: The other direction
description: Feeding a file into a command's input.
prompt: "Count the lines of `logs/app.log` by feeding the file into `wc` with `<`, instead of naming it."
success: "With `<`, the command never learns the filename — which is exactly why the output has no name in it."
focus:
  wc: count lines, words and bytes
  cat: print a file
hints:
  - "There is an operator that points the other way."
  - "`<` connects a file to a command's standard *input*."
  - "`wc -l < logs/app.log`."
---

`>` redirects standard output. `<` redirects standard input:

```
wc -l < logs/app.log
```

Compare it with `wc -l logs/app.log`. Same number — but look at the output. The
version with `<` prints only the count, with no filename beside it.

That is not cosmetic. It tells you what actually happened:

- `wc -l logs/app.log` — `wc` opened the file itself, so it knows its name.
- `wc -l < logs/app.log` — the **shell** opened the file and handed `wc` an
  anonymous stream. `wc` has no idea where the bytes came from.

That second shape is the important one, because it is how every command in the
next chapter works. A tool that reads standard input does not care whether the
bytes came from a file, your keyboard, or another program. It cannot tell, and
it does not need to.
