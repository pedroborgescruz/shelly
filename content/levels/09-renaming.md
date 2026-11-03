---
id: 9
chapter: manipulation
title: Renaming
description: There is no rename command, and none is needed.
prompt: "Rename `draft.md` to `README.md`, and end with it inside `docs/`."
success: "Renaming is moving a file to a new name in the same directory. Unix never needed a separate command for it."
focus:
  mv: move or rename
hints:
  - "Unix has no `rename`. Think about what renaming actually *is*."
  - "`mv old new` renames. `mv file directory/` moves."
  - "Two steps, or one: `mv draft.md docs/README.md`."
---

There is no `rename` command, because renaming and moving are the same
operation: *change the path this file lives at*.

```
mv draft.md README.md      # same directory, new name — a rename
mv README.md docs/         # same name, new directory — a move
mv draft.md docs/README.md # both at once
```

`mv` follows the same rule `cp` does: if the destination is an existing
directory, the file goes inside it keeping its name; otherwise the destination
*is* the new name.

One sharp edge worth knowing now: `mv` **overwrites silently**. If `docs/README.md`
already existed, it would be gone, with no warning and no undo. The shell
assumes you meant it.
