---
id: 4
chapter: orientation
title: Up and back
description: Climbing out of a directory without typing its address.
prompt: "You are deep in `src`. Get back to your home directory without typing an absolute path."
success: "`..` is the parent, `~` is home, and a bare `cd` is home too. None of them need you to know where you are."
focus:
  cd: change directory — try `..`, `~`, and nothing at all
  pwd: print the current directory
hints:
  - "There is a name that always means *the directory above this one*."
  - "That name is `..`, and it can be chained: `../..` is two levels up."
  - "Three levels up from `src` is home. Or skip the counting entirely: `cd ~`."
---

Every directory contains two entries you never see in `ls`:

- `.` — this directory
- `..` — the directory above it

So `cd ..` goes up one level, and they chain: `cd ../..` goes up two.
`cd ../projects` goes up one and back down a different branch — which is how you
move sideways without ever typing a full path.

Three shortcuts worth memorising now:

- `~` is your home directory. `cd ~` works from anywhere.
- `cd` with no arguments also goes home.
- `cd -` goes back to wherever you just were, like a browser's back button.

The difference between `cd /home/shelly/projects` and `cd ../projects` is the
difference between an **absolute** path — starting at `/`, true from anywhere —
and a **relative** one, read from where you are standing.
