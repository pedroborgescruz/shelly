---
id: 3
chapter: orientation
title: Moving
description: Change where the shell is standing.
prompt: "Move into `projects/web`, then confirm with `pwd` that you actually got there."
success: "`cd` moves, `pwd` confirms. Checking instead of assuming is the habit worth building."
focus:
  cd: change the current directory
  pwd: print the current directory
hints:
  - "One command moves you; the other proves it."
  - "`cd` takes a path, and a path can have more than one segment."
  - "`cd projects/web` — or `cd projects` then `cd web`. Then `pwd`."
---

`cd` — *change directory* — moves the shell.

```
cd projects
cd projects/web
```

A path with several segments works in one go: `cd projects/web` is the same as
`cd projects` followed by `cd web`.

`cd` is one of the few commands that says nothing when it succeeds. Silence is
success — the Unix convention is that a command only speaks up when it has
something you need to know.

Which is exactly why `pwd` matters. The prompt in this game shows your location,
but a prompt is configurable and can lie, or simply not be there. `pwd` asks the
shell itself.

If `cd` cannot find the directory, it says so. Read that message: nine times out
of ten you are not where you thought you were.
