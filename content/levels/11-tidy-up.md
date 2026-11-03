---
id: 11
chapter: manipulation
title: Tidy up
description: Everything from this chapter, on one messy directory.
prompt: "Tidy `inbox`: move both `.log` files into `logs/`, delete `tmp/`, and rename `notes` to `NOTES.md`."
success: "Four small commands, one tidy directory. This is what most shell work actually looks like."
focus:
  mv: move or rename
  rm: remove files and directories
  ls: check your work
hints:
  - "Three separate jobs. Do them one at a time and `ls` between each."
  - "`mv` into a directory keeps the filename; `mv` to a new name renames."
  - "`mv a.log logs/`, `mv b.log logs/`, `rm -r tmp`, `mv notes NOTES.md`."
---

Nothing new here — this level is the chapter, used together.

A habit worth stealing from people who do this all day: **`ls` between steps.**
Not because the commands are unreliable, but because the cost of noticing a
mistake now is a second, and the cost of noticing it three commands later can be
a file you cannot get back.

`mv` accepts several sources at once when the last argument is a directory:

```
mv a.log b.log logs/
```

That is the same shape as `cp`. Once the chapter on globbing arrives, that line
becomes `mv *.log logs/` — but the shape does not change.
