---
id: 24
chapter: pipes
title: Asking grep better questions
description: Flags turn one command into several.
prompt: "Count how many lines of `logs/app.log` mention `warn`, in any capitalisation."
success: "`-i` for case, `-v` to invert, `-c` to count, `-n` for line numbers. Four flags, and `grep` covers most of what you will ever ask of it."
focus:
  grep: keep only matching lines
  wc: count lines
hints:
  - "Look at the log: the level is written three different ways."
  - "One flag makes the match case-insensitive. Another makes `grep` print a count instead of the lines."
  - "`cat logs/app.log | grep -ic warn` — or pipe into `wc -l`."
---

`grep` is case-sensitive by default, which bites constantly with log levels:
`WARN`, `Warn` and `warn` are three different patterns.

```
grep -i warn     # ignore case
grep -v warn     # invert: every line that does NOT match
grep -c warn     # print how many lines matched, not the lines
grep -n warn     # prefix each match with its line number
```

They combine: `grep -ic warn` counts case-insensitively.

Two of these deserve special attention.

**`-v`** is how you subtract. `grep -v INFO` on a log gives you everything
interesting, by removing the thing that is not.

**`-c`** has a sibling you already know: `| wc -l`. They give the same number
here, and will not always — `grep -c` counts *matching lines*, while a pipeline
counts whatever actually came through it. When they disagree, the pipeline is
usually telling you something you did not expect.

Exit codes matter too: `grep` exits 0 when it found something and 1 when it did
not. That is what makes it useful in `&&` chains later.
