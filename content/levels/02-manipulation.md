---
id: 2
chapter: manipulation
title: Manipulation
description: Make directories and files, and watch the tree change.
prompt: "Inside `~/projects`, create a `src` directory holding an empty file called `index.ts`."
success: "`mkdir` for the shape, `touch` for the leaves. `mkdir -p src/lib/utils` would have built the whole branch in one go."
focus:
  mkdir: create a directory (-p for parents)
  touch: create an empty file
hints:
  - "Two commands, in order. The directory has to exist before anything can live inside it."
  - "`mkdir src` first. Then `touch` a path that goes *through* it."
  - "The second argument is a path, not just a name: `touch src/index.ts`."
---

Creating things is two commands, and they do not overlap:

- `mkdir <name>` makes a **directory**.
- `touch <name>` makes an empty **file** (or, on an existing file, just
  updates its timestamp).

Both take paths, not only names, so `mkdir src` and `mkdir ./src` are the same
thing — and `touch src/index.ts` only works once `src` exists. When you need the
whole chain at once, `mkdir -p a/b/c` creates every missing parent.

You can also pass several names: `touch a.ts b.ts c.ts`.

Keep an eye on the right pane. Every entry you create appears there the moment
the command returns.
