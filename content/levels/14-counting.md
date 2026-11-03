---
id: 14
chapter: reading
title: Counting
description: How big is this thing, exactly?
prompt: "Count how many lines are in `logs/app.log`."
success: "`wc -l` turns a file into a single number — which is why it ends up at the end of so many pipelines."
focus:
  wc: count lines, words and bytes
hints:
  - "`wc` counts things. By default it counts three different things at once."
  - "There is a flag that narrows it to lines only."
  - "`wc -l logs/app.log`."
---

```
wc logs/app.log      # lines, words, bytes
wc -l logs/app.log   # lines only
```

`wc` — *word count* — prints three numbers: lines, words, and bytes. The flags
pick one: `-l` for lines, `-w` for words, `-c` for bytes.

`-l` is the one you will use ninety percent of the time, because "how many" is
usually a question about *records*, and in a text file one record is one line.
How many errors today. How many users in the export. How many files matched.

The reason `wc -l` matters so much is what happens in the next chapter: once you
can pipe one command into another, `wc -l` becomes the universal way to turn a
list of anything into a count of it.

Note that `wc -l` counts **newlines**. A file whose last line has no trailing
newline will read as one less than you expect — an off-by-one that has confused
everyone at least once.
