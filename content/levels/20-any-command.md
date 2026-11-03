---
id: 20
chapter: streams
title: Any command's output
description: Redirection is not an `echo` feature.
prompt: "Save a listing of this directory into a file called `inventory.txt`."
success: "Every command writes to standard output, so every command can be redirected. There is nothing special about `echo`."
focus:
  ls: list directory contents
  cat: read the file back
hints:
  - "The same operator from the last two levels, on a different command."
  - "`ls` writes to standard output just like `echo` does."
  - "`ls > inventory.txt`, then `cat inventory.txt` to check."
---

So far `>` has only appeared after `echo`, which makes it easy to assume the two
are related. They are not.

```
ls > inventory.txt
wc -l logs/app.log > count.txt
cat a.log b.log > combined.log
```

**Standard output is a property of the process, not of the command.** Every
program writes to it; the shell decides where it goes. That is the entire idea,
and it is why a toolkit of small programs composes at all.

One real-terminal detail worth knowing: the shell creates the output file
*before* running the command. So `ls > inventory.txt` on a real system lists
`inventory.txt` too, because it already existed by the time `ls` looked. Shelly
does not model that — but when you see it for real, now you know why.

The classic disaster this causes: `sort file.txt > file.txt` truncates the file
before `sort` reads it, leaving you with nothing.
