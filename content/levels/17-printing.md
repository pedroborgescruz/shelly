---
id: 17
chapter: streams
title: Printing
description: The simplest command, and the first lesson in quoting.
prompt: "Print exactly `hello   world` — with three spaces between the two words."
success: "The shell split your words before `echo` ever saw them. Quoting is how you stop it."
focus:
  echo: print its arguments
hints:
  - "Try it without quotes first and look closely at what comes out."
  - "The shell collapses runs of whitespace between arguments."
  - "Wrap the whole thing in quotes: `echo \"hello   world\"`."
---

```
echo hello world
```

`echo` prints its arguments, separated by a single space, followed by a newline.
Note *arguments*, plural — that is the catch.

Before `echo` runs, the shell splits your line on whitespace. By the time
`echo` is handed `hello` and `world`, the three spaces you typed are gone. They
were never part of an argument; they were the thing *between* arguments.

Quoting stops the splitting:

```
echo "hello   world"
```

Now it is one argument, spaces included.

Single and double quotes differ in ways that matter later — `"$HOME"` expands
inside double quotes and stays literal inside single ones — but for plain text
either works.

This is the most common source of shell bugs, by a wide margin: a filename with
a space in it, unquoted, silently becoming two arguments.
