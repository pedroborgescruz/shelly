---
id: 3
chapter: streams
title: Redirection
description: Point a command's output somewhere other than the screen.
prompt: "Write the line `API_KEY=shelly-dev-7f3a` into a hidden file named `.env` in `~/projects`."
success: "You just wrote a file without an editor. `>` replaces, `>>` appends — and `ls -a` is how you find the dotfiles you forgot about."
focus:
  echo: print its arguments
  cat: print a file's contents
hints:
  - "You already know the command that prints text. The question is where that text lands."
  - "`echo` writes to standard output. Standard output can be pointed at a file."
  - "The operator is `>`, and the file it writes to does not need to exist first."
---

Every command writes to a stream called **standard output**. By default
that stream is drawn on your screen — but it is just a pipe, and you can point
it elsewhere.

- `>` sends stdout into a file, **replacing** whatever was there.
- `>>` **appends** to the end of the file instead.

So `echo hello` prints `hello`, while `echo hello > greeting.txt` prints nothing
and leaves a file behind. The file is created if it does not exist.

`>` truncates without asking. That is the single most common way people destroy
a config file: `echo one > f` then `echo two > f` leaves only `two`.

A name beginning with a dot is **hidden** — conventional for config, not
secure. Plain `ls` will not show it; `ls -a` and `cat` will.
