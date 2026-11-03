---
id: 13
chapter: reading
title: Head and tail
description: The first few lines, or the last few.
prompt: "Print the first 3 lines of `logs/app.log`, then the last 3."
success: "`head` to see the shape of a file, `tail` to see what just happened. Both default to 10 lines."
focus:
  head: print the beginning of a file
  tail: print the end of a file
hints:
  - "Two commands, one for each end of the file."
  - "Both take a line count: `-n 3`. The shorthand `-3` works too."
  - "`head -n 3 logs/app.log`, then `tail -n 3 logs/app.log`."
---

A log file can be a hundred thousand lines long. `cat` will happily print all of
them, and you will see none.

```
head -n 3 logs/app.log    # the first 3 lines
tail -n 3 logs/app.log    # the last 3 lines
```

Both default to 10 lines when you leave `-n` off. `head -3` is accepted as
shorthand for `head -n 3`.

They answer different questions, and the difference is worth internalising:

- **`head`** tells you what *kind* of file this is — the header row of a CSV,
  the format of a log line, whether it is text at all.
- **`tail`** tells you what *just happened*. A log is written in order, so the
  end of the file is the most recent event. When something breaks, `tail` is
  almost always the first command anyone runs.

At a real terminal, `tail -f` keeps the file open and prints new lines as they
arrive — watching a log live while you reproduce a bug.
