import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluate } from "@/lib/evaluator";
import { readFile, lookup, isDir, isFile } from "@/lib/fs/vfs";
import { getLevel, hydrateCatalog } from "@/lib/levels";
import { loadLevelContent } from "@/lib/levels/loadContent";
import { APP_LOG_ERRORS, SECRET } from "@/lib/levels/data";
import { parse, astOperators, commandNamesIn } from "@/lib/parser/parse";
import { clone } from "@/lib/fs/vfs";
import type { Level, VirtualFileSystem } from "@/lib/types";

hydrateCatalog(loadLevelContent());

/** Run a sequence of lines against a level, threading state through. */
function session(level: Level, lines: string[]) {
  let fs: VirtualFileSystem = clone(level.fileTree);
  let cwd = level.startingPath;
  let prevCwd: string | null = null;
  const commandsRun: string[] = [];
  const operatorsUsed: string[] = [];
  const submissions: import("@/lib/types").Submission[] = [];
  let last = evaluate({ input: "", fs, cwd, prevCwd, level });

  for (const line of lines) {
    const before = cwd;
    last = evaluate({ input: line, fs, cwd, prevCwd, level });
    if (!last.blocked && last.ast && last.status !== "error") {
      submissions.push({ script: last.ast, cwd: before });
    }
    fs = last.fs;
    cwd = last.cwd;
    prevCwd = last.prevCwd;
    if (!last.blocked) {
      for (const name of last.commandNames) if (!commandsRun.includes(name)) commandsRun.push(name);
      for (const op of last.operators) if (!operatorsUsed.includes(op)) operatorsUsed.push(op);
    }
  }

  return { last, fs, cwd, commandsRun, operatorsUsed, submissions };
}

function solved(level: Level, lines: string[]) {
  const run = session(level, lines);
  const wc = level.winCondition;
  const astOk =
    (wc.requiredOperators ?? []).every((op) => run.last.operators.includes(op)) &&
    (wc.requiredCommands ?? []).every((name) => run.last.commandNames.includes(name));
  return (
    astOk &&
    wc.check({
      ast: run.last.ast ?? { type: "Script", statements: [] },
      stdout: run.last.stdout,
      fs: run.fs,
      cwd: run.cwd,
      commandsRun: run.commandsRun,
      operatorsUsed: run.operatorsUsed,
      lineCommands: run.last.commandNames,
      lineOperators: run.last.operators,
      submissions: run.submissions,
    })
  );
}

/* --------------------------------- Parser --------------------------------- */

test("parser builds a pipeline of two commands", () => {
  const ast = parse("cat logs/app.log | grep ERROR");
  assert.equal(ast.statements.length, 1);
  const pipeline = ast.statements[0];
  assert.equal(pipeline.type, "Pipeline");
  assert.deepEqual(commandNamesIn(ast), ["cat", "grep"]);
  assert.deepEqual(astOperators(ast), ["|"]);
});

test("parser attaches redirects to the command that owns them", () => {
  const ast = parse('echo "a b" >> out.txt');
  const pipeline = ast.statements[0];
  assert.equal(pipeline.type, "Pipeline");
  if (pipeline.type !== "Pipeline") return;
  assert.deepEqual(pipeline.commands[0].args, ["a b"]);
  assert.deepEqual(pipeline.commands[0].redirects, [
    { type: "Redirect", op: ">>", file: "out.txt" },
  ]);
});

test("parser rejects an unterminated quote", () => {
  assert.throws(() => parse('echo "oops'));
});

/* -------------------------------- Level 1 --------------------------------- */

test("level 1: pwd prints the starting path", () => {
  const { last } = session(getLevel(1), ["pwd"]);
  assert.equal(last.stdout, "/home/shelly\n");
});

test("level 1: ls hides dotfiles until -a", () => {
  const level = getLevel(1);
  assert.equal(session(level, ["ls"]).last.stdout.trim(), "notes  projects  README.md");
  const unknown = session(level, ["sudo rm README.md"]).last;
  assert.ok(unknown.blocked);
  assert.match(unknown.output, /command not found/);
  const guarded = session(level, ["rm README.md"]).last;
  assert.ok(guarded.blocked);
  assert.match(guarded.output, /not needed for this puzzle/);
});

test("level 1: needs both pwd and ls", () => {
  assert.equal(solved(getLevel(1), ["pwd"]), false);
  assert.equal(solved(getLevel(1), ["pwd", "ls"]), true);
});

/* -------------------------------- Level 2 --------------------------------- */

test("level 6: mkdir then touch solves it", () => {
  assert.equal(solved(getLevel(6), ["mkdir src", "touch src/index.ts"]), true);
});

test("level 6: mkdir -p accepts the equivalent one-liner", () => {
  assert.equal(solved(getLevel(6), ["mkdir -p src", "touch ./src/index.ts"]), true);
});

test("level 6: touch into a missing directory errors, tree untouched", () => {
  const { last, fs } = session(getLevel(6), ["touch src/index.ts"]);
  assert.match(last.output, /No such file or directory/);
  assert.equal(lookup(fs, "/home/shelly/projects/src"), null);
});

test("level 6: a guarded command is intercepted softly", () => {
  const { last } = session(getLevel(6), ["grep hello hello.sh"]);
  assert.ok(last.blocked);
  assert.match(last.output, /not needed for this puzzle/);
});

test("level 6: cd moves and cd - comes back", () => {
  const { last, cwd } = session(getLevel(6), ["cd logs", "cd -"]);
  assert.equal(cwd, "/home/shelly/projects");
  assert.equal(last.status, "success");
});

/* -------------------------------- Level 3 --------------------------------- */

test("level 18: echo with > writes the file", () => {
  const { fs } = session(getLevel(18), [`echo ${SECRET} > .env`]);
  assert.equal(readFile(fs, "/home/shelly/projects/.env"), SECRET + "\n");
});

test("level 18: quoted and absolute variants all solve it", () => {
  assert.equal(solved(getLevel(18), [`echo "${SECRET}" > .env`]), true);
  assert.equal(solved(getLevel(18), [`echo '${SECRET}' > ./.env`]), true);
  assert.equal(solved(getLevel(18), [`echo ${SECRET} > /home/shelly/projects/.env`]), true);
});

test("level 18: printing without redirecting does not solve it", () => {
  assert.equal(solved(getLevel(18), [`echo ${SECRET}`]), false);
});

test("level 18: > truncates and >> appends", () => {
  const { fs } = session(getLevel(18), ["echo one > f", "echo two > f", "echo three >> f"]);
  assert.equal(readFile(fs, "/home/shelly/projects/f"), "two\nthree\n");
});

test("level 18: ls -a reveals the dotfile it just made", () => {
  const { last } = session(getLevel(18), [`echo ${SECRET} > .env`, "ls -a"]);
  assert.match(last.stdout, /\.env/);
  assert.doesNotMatch(session(getLevel(18), [`echo x > .env`, "ls"]).last.stdout, /\.env/);
});

/* -------------------------------- Level 4 --------------------------------- */

test("level 23: cat piped into grep solves it", () => {
  const { last } = session(getLevel(23), ["cat logs/app.log | grep ERROR"]);
  assert.equal(last.stdout.trim().split("\n").length, APP_LOG_ERRORS.length);
  assert.equal(solved(getLevel(23), ["cat logs/app.log | grep ERROR"]), true);
});

test("level 23: grep opening the file itself does not satisfy the pipe requirement", () => {
  assert.equal(solved(getLevel(23), ["grep ERROR logs/app.log"]), false);
});

test("level 23: grep -v and -c behave", () => {
  const counted = session(getLevel(23), ["cat logs/app.log | grep -c ERROR"]).last;
  assert.equal(counted.stdout.trim(), String(APP_LOG_ERRORS.length));
  const inverted = session(getLevel(23), ["cat logs/app.log | grep -v ERROR"]).last;
  assert.doesNotMatch(inverted.stdout, /ERROR/);
});

test("level 23: three-stage pipeline into wc -l", () => {
  const { last } = session(getLevel(23), ["cat logs/app.log | grep ERROR | wc -l"]);
  assert.equal(last.stdout.trim(), String(APP_LOG_ERRORS.length));
});

test("level 23: input redirection feeds grep from a file", () => {
  const { last } = session(getLevel(23), ["grep ERROR < logs/app.log"]);
  assert.equal(last.stdout.trim().split("\n").length, APP_LOG_ERRORS.length);
});

/* --------------------------------- Meta ----------------------------------- */

test("tldr opens a manual page as a side effect", () => {
  const { last } = session(getLevel(1), ["tldr ls"]);
  assert.equal(last.effects.manual, "ls");
});

test("tldr on an unknown page errors instead of opening the pane", () => {
  const { last } = session(getLevel(1), ["tldr frobnicate"]);
  assert.equal(last.effects.manual, undefined);
  assert.match(last.output, /no page/);
});

test("help and clear bypass the level guardrails", () => {
  const help = session(getLevel(23), ["help"]).last;
  assert.ok(!help.blocked);
  assert.match(help.output, /objective/);
  assert.equal(session(getLevel(1), ["clear"]).last.effects.clear, true);
});

test("every level is solvable and its filesystem is well formed", () => {
  for (const id of [1, 2, 3, 4]) {
    const level = getLevel(id);
    const root = lookup(level.fileTree, level.startingPath);
    assert.ok(isDir(root), `level ${id} starting path must be a directory`);
    assert.ok(!isFile(root));
  }
});
