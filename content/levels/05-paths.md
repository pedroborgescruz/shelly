---
id: 5
chapter: orientation
title: Absolute and relative
description: Reaching somewhere without going there.
prompt: "Standing in `notes`, list the contents of `~/projects/web/src` — without leaving `notes`."
success: "Most commands take a path, which means most of the time you do not need to `cd` at all."
focus:
  ls: list any directory, from anywhere
  cd: change directory
  pwd: print the current directory
hints:
  - "You do not need to move. `ls` takes a path argument."
  - "From `notes`, the route is up one level and back down — or start from `~`."
  - "`ls ../projects/web/src`, or `ls ~/projects/web/src`."
---

A path is **absolute** when it starts at the root, `/`:

```
/home/shelly/projects/web/src
```

That path means the same thing from anywhere on the system. A path is
**relative** when it starts anywhere else — it is read from your current
directory:

```
../projects/web/src
```

`~` is a third option: the shell expands it to your home directory before the
command ever sees it, so `~/projects` is absolute in effect but short to type.

The habit this level is really teaching: **`cd` less than you think you need
to.** Almost every command takes a path, so you can read, list, copy and move
things across the tree while standing still. Changing directory is for when you
are about to do several things in the same place.
