---
id: 8
chapter: manipulation
title: Copying
description: Two files where there was one.
prompt: "Make a `backup` directory and put a copy of `hello.sh` inside it, leaving the original where it is."
success: "`cp a b` names the copy `b` — unless `b` is an existing directory, in which case the copy goes inside it. That one rule explains most `cp` surprises."
focus:
  cp: copy a file, or a directory with `-r`
  mkdir: create a directory
hints:
  - "Two steps. The destination has to exist before you can copy into it."
  - "`mkdir backup` first — otherwise `cp` will just make a *file* called `backup`."
  - "`mkdir backup`, then `cp hello.sh backup/`."
---

```
cp source destination
```

The whole of `cp` hangs on one question: **does the destination already exist
as a directory?**

- If it does, the copy is placed *inside* it, keeping its name.
- If it does not, the destination *is* the new name.

So `cp notes.txt backup` makes a file called `backup` when no such directory
exists — and quietly puts `backup/notes.txt` in place when one does. Same
command, different outcome, depending on the state of the filesystem.

Writing the trailing slash — `cp notes.txt backup/` — makes your intent
explicit and turns a silent surprise into an error.

Directories need `-r`, for *recursive*: `cp -r src src-backup` copies the
directory and everything under it. Without `-r`, `cp` refuses.
