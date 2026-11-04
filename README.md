# Shelly

An interactive, web-based game that teaches the Unix shell by making you use one.
Guardrailed puzzles, grouped into chapters, working through the command-line
ground of [The Missing Semester](https://missing.csail.mit.edu/).

**29 levels across 5 chapters** are playable today:

1. **Orientation** — `pwd` `ls` `cd`, absolute vs relative paths, `..` and `~`
2. **Making and breaking** — `mkdir -p` `touch` `cp` `mv` `rm -r`, dotfiles
3. **Reading** — `cat` `head` `tail` `wc`, and passing lists of files
4. **Streams** — `>` `>>` `<`, quoting, and why redirection is not an `echo` feature
5. **Pipes and filters** — `|` `grep` `sort` `uniq -c` `cut` `tr`, ending on the
   extract-group-count-rank pipeline

See [docs/ROADMAP.md](docs/ROADMAP.md) for the seven chapters still to come, and
for which Missing Semester lectures this engine can and cannot simulate.

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # engine tests (node:test via tsx)
```

For how the pieces fit together, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## How it works

The game is a small shell implementation, not a scripted animation. A submitted
line goes through a real pipeline:

```
input string → tokenizer → AST → guardrails → evaluator → new filesystem + output
```

Working on an AST rather than matching regexes is what lets a level accept every
equivalent spelling of a solution. Level 3 is satisfied by `echo X > .env`,
`echo "X" > ./.env` and `echo X > /home/shelly/projects/.env` alike, because the
win condition asserts on the resulting **state**, not on the text typed.

### Layout

| Path | What lives there |
| --- | --- |
| `lib/parser/` | `tokenize.ts` (words, quotes, operators) and `parse.ts` (the AST) |
| `lib/fs/vfs.ts` | The virtual filesystem: path resolution, mutations, ASCII tree rendering |
| `lib/commands/` | One implementation per command — `pwd` `ls` `cd` `mkdir` `touch` `cp` `mv` `rm` `echo` `cat` `grep` `wc` `sort` `uniq` `cut` `tr` `tee` `head` `tail` `tldr` `clear` |
| `lib/evaluator.ts` | Guardrails, pipelines, redirection, `&&`/`\|\|`, and the win check inputs |
| `content/levels/*.md` | **The prose half of a level**: lesson, objective, hints, success line |
| `lib/levels/rules/` | **The executable half**, one file per chapter: starting world, win condition, diagnostics, solutions |
| `lib/levels/worlds.ts` | Starting filesystems shared across a chapter |
| `lib/levels/assert.ts` | AST helpers for levels that only read and so change nothing |
| `lib/levels/chapters.ts` | The curriculum spine, and which commands each chapter unlocks |
| `lib/tldr.ts` | The abridged manual pages shown in the right pane |
| `store/useShellStore.ts` | Zustand "kernel": filesystem, cwd, history, progress, help ladder |
| `components/` | The TUI — chapter map, header, lesson pane, terminal, ASCII tree, manual |

Levels are split in half on purpose. Markdown is the right medium for lesson
copy — no backtick escaping, readable in a diff — and TypeScript is the right
medium for a win condition. `app/level/[id]/page.tsx` reads the markdown on the
server and hands it to the client, which merges it with `LEVEL_RULES`.

### Commands are pure-ish functions

```ts
type CommandImpl = (args: string[], stdin: string, ctx: ExecContext) => CommandResult;
```

Everything reads `stdin` and writes `stdout`/`stderr`, so the evaluator can wire
them into a pipeline without any command knowing it is in one. That is also why
`cat f | grep X | wc -l` works even though no level asks for it.

Each submission runs against a **clone** of the filesystem, so a line that fails
halfway cannot leave the tree half-mutated, and React always gets a new object
to render.

## Adding a level

Two files. First the prose, as `content/levels/05-globbing.md`:

```md
---
id: 5
chapter: globbing
title: Wildcards
description: One pattern, many files.
prompt: "Delete every `.tmp` file in `~/scratch` with a single command."
success: "…"
focus:
  rm: remove files
hints:
  - "You do not need to name each file."
  - "`*` stands in for any run of characters."
---

Lesson body, in plain markdown.
```

Then the rules, in the chapter's file under `lib/levels/rules/`:

```ts
5: {
  startingPath: "/home/shelly/scratch",
  fileTree: homeAt({ scratch: dir({ /* … */ }) }),
  winCondition: {
    requiredCommands: ["rm"],            // asserted against the AST
    check: ({ fs }) => /* … */ true,     // asserted against the resulting state
  },
  diagnostics: [{ when: ({ lineCommands }) => /* … */ false, say: "…" }],
  solutions: [["rm *.tmp"]],
  nearMisses: [["rm a.tmp"]],
},
```

`allowedCommands` is **derived, never authored**: a level allows everything its
chapter and all earlier chapters unlock (`lib/levels/chapters.ts`). The `focus`
map only supplies the friendlier one-liner `help` prints. A command outside that
set is intercepted before it runs, with a soft "not needed for this puzzle"
message rather than an error — the guardrail is a nudge, not a wall. `tldr`,
`help`, `hint`, `solve`, `clear` and `reset` always work.

The loader validates as it reads: an unknown chapter, a missing field, a `focus`
command the chapter never unlocked, or a level with content but no rules all
fail the build rather than shipping a broken level.

## Getting unstuck

Five rungs, from passive to explicit:

1. `tldr <cmd>` — real examples in the right pane. Looking things up *is* the
   skill being taught, so this is always available.
2. **A near-miss diagnostic.** When the shape of an attempt is wrong in a
   specific way, the level says so specifically — "you printed the text to the
   screen; now point that output at a file" — instead of staying silent.
3. **An unprompted nudge** after three attempts without progress.
4. `hint` — two or three per level, each more specific than the last.
5. `solve` — types the next line of the canonical solution *into the prompt*
   rather than printing it, so the answer still passes through your fingers.
   Levels finished this way are marked "with help" on the map.

## Testing

`tests/levels.test.ts` iterates the whole catalog and asserts, for every level:
each canonical solution solves it, no near miss solves it, every near miss gets
either a diagnostic or a shell error, the prose is actually authored, and every
unlocked command is implemented and documented.

That contract is what makes the catalog safe to grow: a broken level fails the
suite rather than someone's afternoon.

## Levels that change nothing

A level about `cd` or `ls` leaves the filesystem exactly as it found it, so
there is no state to assert on. Those win conditions read `submissions` instead
— every accepted line this level, parsed, with the directory it ran from:

```ts
check: ({ cwd, submissions }) =>
  cwd === NOTES && ran(submissions, "ls", { operandPaths: [SRC] }),
```

`ran` works on the AST, never on the raw text, so `ls -la`, `ls -a -l` and
`ls -al` are one assertion — and `ls ../projects/web/src`, `ls ~/projects/web/src`
and the absolute path all resolve to the same answer.

## Not built yet

- Chapters 6–12 (see [docs/ROADMAP.md](docs/ROADMAP.md)).
- No `vim` module and no native CLI build — both need their own engine.
