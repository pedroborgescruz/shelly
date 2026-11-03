---
id: 2
chapter: orientation
title: Looking around
description: Hidden files, long listings, and looking somewhere else.
prompt: "You are standing in your home directory. Reveal its hidden entries, then list `projects` without moving into it."
success: "`ls` is not just `ls`. Flags change what you see; an argument changes where you look."
focus:
  ls: list contents (-a for hidden, -l for detail, or a path to look elsewhere)
hints:
  - "You are already *in* your home directory, so the first command needs no path at all — just a flag."
  - "The flag for hidden entries is `-a`. Then: `ls` also accepts a path."
  - "Two lines: `ls -a`, then `ls projects`."
---

`ls` takes flags *and* arguments, and they do different jobs.

**Flags change what you see.**

- `-a` includes entries whose name starts with a dot. Those are hidden by
  convention, not by permission — `.bashrc`, `.gitconfig`, `.env`.
- `-l` switches to the long listing: permissions, owner, size, name.
- They combine freely: `ls -la`, `ls -a -l`, `ls -al` are the same command.

**An argument changes where you look.** `ls projects` lists that directory
without moving you into it — and with no argument at all, `ls` lists wherever
you are standing. That is worth being deliberate about: you are *in* your home
directory right now, so `ls -a` already points at it. There is no `home` to
pass as an argument; `home` is a directory much further up, at `/home`. This matters more than it sounds: at a real
terminal, most of the time you want to *glance* somewhere, not go there.

A dotfile you cannot see is still a file. Plenty of confusing afternoons end
with someone running `ls -a` and finding the config they swore was missing.
