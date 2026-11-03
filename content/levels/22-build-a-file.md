---
id: 22
chapter: streams
title: Build a file
description: The chapter, used together.
prompt: "Create a `docs/` directory, then write `docs/stock.txt` so it contains exactly two lines: `# stock` and `hello.sh`."
success: "A directory, a header, an entry — and no editor was involved at any point."
focus:
  echo: print its arguments
  mkdir: create a directory
  cat: check your work
hints:
  - "The directory has to exist before you can redirect into it."
  - "Header with `>`, entry with `>>`."
  - "`#` starts a comment unless you quote it: `echo '# stock' > docs/stock.txt`."
---

Nothing new. The one trap is on the first line.

```
echo # stock > docs/stock.txt
```

That writes an **empty file**. `#` begins a comment, so the shell throws away
everything after it — including the redirection. The command that actually ran
was `echo`, with no arguments.

Quote it, and `#` is just a character:

```
echo '# stock' > docs/stock.txt
echo hello.sh >> docs/stock.txt
```

This is the same lesson as level 17 wearing a different hat: **the shell reads
your line before any command does.** Spaces, `#`, `>`, `*`, `$` — these are
shell syntax, and quoting is how you say "no, I meant the literal character".

When something behaves strangely, the first question is always: did the shell
rewrite my line before the command saw it?
