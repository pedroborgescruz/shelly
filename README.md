# Shelly

An interactive, web-based game that teaches the Unix shell by making you use one.
Four guardrailed puzzles cover the ground of *The Missing Semester* lecture 1:
orientation, file manipulation, redirection, and pipes.

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # engine tests (node:test via tsx)
```

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
| `lib/commands/` | One implementation per command — `pwd`, `ls`, `cd`, `mkdir`, `touch`, `echo`, `cat`, `grep`, `wc`, `head`, `tail`, `tldr`, `clear` |
| `lib/evaluator.ts` | Guardrails, pipelines, redirection, `&&`/`\|\|`, and the win check inputs |
| `lib/levels/` | One file per level: lesson copy, starting filesystem, allowed commands, win condition |
| `lib/tldr.ts` | The abridged manual pages shown in the right pane |
| `store/useShellStore.ts` | Zustand "kernel": filesystem, cwd, history, progress |
| `components/` | The TUI — header, lesson pane, terminal, ASCII tree, manual |

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

Drop a file in `lib/levels/` and register it in `lib/levels/index.ts`:

```ts
export const level5: Level = {
  id: 5,
  title: "…",
  lesson: "markdown",
  prompt: "one-line objective",
  initialState: { startingPath: "/home/shelly", fileTree: homeAt({ /* … */ }) },
  allowedCommands: { ls: { hint: "list directory contents" } },
  winCondition: {
    requiredOperators: ["|"],        // asserted against the AST
    requiredCommands: ["grep"],      // asserted against the AST
    check: ({ fs, stdout }) => true, // asserted against the resulting state
  },
  successMessage: "…",
};
```

A command absent from `allowedCommands` is intercepted before it runs, with a
soft "not needed for this puzzle" message rather than an error — the guardrail
is a nudge, not a wall. `tldr`, `help`, `clear` and `reset` always work.

## Divergences from the PRD

- **No `bash-parser`.** The published package does not bundle cleanly for the
  browser, and the grammar Shelly needs is small. `lib/parser/` is a hand-written
  tokenizer and recursive-descent parser producing the same shape of AST.
- **Win conditions are state-first.** The PRD's `targetCommand` /`requiredArgs`
  shape makes "accept any valid syntax" hard. `requiredOperators` and
  `requiredCommands` keep the AST assertions where they matter (you *must* use a
  pipe to pass level 4), and a `check` predicate handles the rest.

## Not built yet

- Progress is in memory only — a reload starts at level 1.
- No `vim` module and no native CLI build (both are V2 in the PRD).
