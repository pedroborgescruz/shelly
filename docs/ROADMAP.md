# Roadmap

Shelly exists because of [The Missing Semester of Your CS Education](https://missing.csail.mit.edu/).
The goal is to cover the command-line ground of that course as playable levels.

## What fits the engine, and what does not

The course has 11 lectures in the 2020 edition (9 in 2026). Only some of them are
"a command operating on a filesystem", which is the only thing this engine
simulates.

| Lecture | Verdict |
| --- | --- |
| 1 — The Shell | **In.** Core of chapters 1–4. |
| 2 — Shell Tools and Scripting | **In.** Chapters 6–10. Needs parser work. |
| 4 — Data Wrangling | **In.** Chapter 11. Needs a `sed`/`awk` subset. |
| 5 — Command-line Environment | **Partly.** Jobs and processes fit; SSH needs a fake network. |
| 3 — Editors (Vim) | **Separate engine.** A keystroke interpreter over a buffer, not a line parser. |
| 6 — Version Control (Git) | **Separate engine.** Needs a commit DAG. [Learn Git Branching](https://learngitbranching.js.org/) already owns this; the only differentiator is git as a *filesystem* thing — staging, conflicts in real files. |
| 7 — Debugging and Profiling | **Out.** Does not simulate as commands. |
| 8 — Metaprogramming | **Out.** |
| 9 — Security and Cryptography | **Out.** |
| 10 — Potpourri | Cherry-pick individual tools. |

Shelly should not pretend to replace the course. For what is out of scope, point
people at the lectures.

## Chapters

Numbers are target level counts, not promises.

| # | Chapter | Teaches | Levels |
| --- | --- | --- | --- |
| 1 | Orientation | `pwd` `ls` `cd`, absolute vs relative paths, `~` | 5 |
| 2 | Making and breaking | `mkdir` `touch` `cp` `mv` `rm`, `-r`, dotfiles | 6 |
| 3 | Reading | `cat` `head` `tail` `wc` `file` `du` | 5 |
| 4 | Streams | stdout vs stderr, `>` `>>` `2>` `<`, `/dev/null`, `tee` | 6 |
| 5 | Pipes and filters | `\|` `grep` `sort` `uniq -c` `cut` `tr` — ends on the word-frequency one-liner | 7 |
| 6 | Globbing | `*` `?` `[]` `{}` and why quoting matters | 5 |
| 7 | Finding things | `find -name/-type/-size`, `-exec`, `xargs`, `grep -r` | 6 |
| 8 | Permissions | `ls -l`, `chmod`, shebangs, `./script.sh`, `$PATH` | 5 |
| 9 | Variables and substitution | `foo=bar`, `$foo`, `"$foo"` vs `$foo`, `$(…)`, `$?`, `&&` `\|\|` | 6 |
| 10 | Scripting | `if` `for` `while`, `$1` `$@`, functions | 7 |
| 11 | Wrangling | `sed` `awk` `paste` `column`, log-analysis capstone | 7 |
| 12 | Jobs and processes | `ps`, `&`, `jobs`, `fg`, `kill`, Ctrl-C/Ctrl-Z | 5 |

Then, as separate tracks: **Vim**, and **Git**.

## Phases

Ordered so that each phase ships playable levels and only pays for engine work
when the next chapter actually needs it.

- **Phase 0 — Foundation.** No new levels. Lessons move to markdown, levels get
  routes and a chapter map, progress persists, the help ladder lands, and a
  generic suite asserts every level against canonical solutions and near misses.
- **Phase 1 — Chapters 1–5** (~29 levels). Needs `cp mv rm sort uniq cut tr tee`
  and nothing from the parser.
- **Phase 2 — Globbing and quoting** in the parser → chapters 6–7, plus `find`
  and `xargs`.
- **Phase 3 — Permission bits and `$PATH`** in the VFS → chapter 8.
- **Phase 4 — Variables, command substitution, compound commands** → chapters 9–10.
  The largest engine lift in the project.
- **Phase 5 — A `sed`/`awk` subset** → chapter 11.
- **Phase 6 — A process model** → chapter 12.
- **Then** the Vim module, then the Git module.

## Design commitments

**Guardrails accumulate; they do not whitelist.** A level allows every command
unlocked by its chapter and all earlier ones, not a hand-maintained list. The
sandbox remembers what you have learned.

**Win conditions assert on state, not on text.** Any spelling that reaches the
goal counts. AST assertions are reserved for when the *mechanism* is the lesson
— you must actually use a pipe to pass chapter 5.

**Getting unstuck is a designed path, not an escape hatch.** In order: `tldr`
docs, a near-miss diagnostic that names what went wrong, an automatic nudge
after repeated failures, progressive `hint`s, and finally `solve` — which types
the answer into the prompt rather than printing it, so it still passes through
your fingers. Levels finished with help are marked as such.

**Every level carries its own tests.** A level ships with canonical solutions
that must pass and near misses that must fail. A generic suite iterates the
catalog, so a broken level fails CI rather than a player's afternoon.
