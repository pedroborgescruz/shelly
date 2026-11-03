---
id: 10
chapter: manipulation
title: Removing
description: There is no trash can.
prompt: "Delete the `tmp` directory and the stray `.DS_Store`, leaving `keep.txt` untouched."
success: "`rm` is permanent. `-r` is what makes it able to delete a directory — and what makes it dangerous."
focus:
  rm: remove files, and with `-r` directories
  ls: list contents (-a to see what you might be missing)
hints:
  - "One of the two is hidden. `ls -a` if you want to see it."
  - "`rm` refuses directories until you tell it to go in: `-r`."
  - "`rm -r tmp`, then `rm .DS_Store`."
---

```
rm file
rm -r directory
```

`rm` does not move things to a trash can. There is no undo, no confirmation,
and no recovery. The file is unlinked and the space is free.

`rm` refuses a directory unless you pass `-r` — *recursive*, meaning "and
everything inside". That refusal is a safety rail: deleting one file by accident
is bad, deleting a tree by accident is a story you tell for years.

Two flags you will meet, and should respect:

- `-f` — *force*: do not complain about files that do not exist.
- `-rf` — both at once. This is the one that empties directories without a
  single question asked. Read the path twice before you press Enter.

Dotfiles are not special to `rm`; they are only hidden from `ls`. If you cannot
see what you are deleting, `ls -a` first.
