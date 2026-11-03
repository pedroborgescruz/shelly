---
id: 16
chapter: reading
title: Which log is bigger?
description: One command, two answers, and a total.
prompt: "With a single `wc`, compare the line counts of both files in `logs/`."
success: "A list of files in, a column of numbers plus a total out. That is the whole chapter in one line."
focus:
  wc: count lines across several files at once
  cat: print a file when you want to see it rather than measure it
hints:
  - "Same flag as before. The difference is how many files you hand it."
  - "`wc -l` accepts a list, and adds a total row at the end."
  - "`wc -l logs/app.log logs/access.log`."
---

Nothing new — this is `wc -l` and a list of files, which you already have.

```
wc -l logs/app.log logs/access.log
```

Each file gets its own line, and because there is more than one, `wc` adds a
`total` row at the bottom.

This is worth doing deliberately once, because it is the shape of a question you
will ask constantly: *of these several things, which one is the big one?* Where
did the disk go, which log is noisy, which source file got out of hand.

You now have the four reading commands: `cat` to see all of it, `head` and
`tail` to see an end of it, `wc` to measure it without looking. The next chapter
stops sending their output to the screen.
