import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluate } from "@/lib/evaluator";
import { clone } from "@/lib/fs/vfs";
import { CHAPTERS, buildLevels, levelsByChapter } from "@/lib/levels";
import { loadLevelContent } from "@/lib/levels/loadContent";
import { isKnownCommand } from "@/lib/commands";
import { TLDR_PAGES } from "@/lib/tldr";
import type { Level, Submission, VirtualFileSystem, WinCheckArgs } from "@/lib/types";

const LEVELS = buildLevels(loadLevelContent());

/** Run a sequence of lines against a level, threading state through. */
function play(level: Level, lines: string[]) {
  let fs: VirtualFileSystem = clone(level.fileTree);
  let cwd = level.startingPath;
  let prevCwd: string | null = null;
  const commandsRun: string[] = [];
  const operatorsUsed: string[] = [];
  const submissions: Submission[] = [];

  let solvedAt = -1;

  lines.forEach((line, index) => {
    const before = cwd;
    const result = evaluate({ input: line, fs, cwd, prevCwd, level });
    if (!result.blocked && result.ast && result.status !== "error") {
      submissions.push({ script: result.ast, cwd: before });
    }
    fs = result.fs;
    cwd = result.cwd;
    prevCwd = result.prevCwd;

    if (!result.blocked) {
      for (const name of result.commandNames) {
        if (!commandsRun.includes(name)) commandsRun.push(name);
      }
      for (const op of result.operators) {
        if (!operatorsUsed.includes(op)) operatorsUsed.push(op);
      }
    }

    const args: WinCheckArgs = {
      ast: result.ast ?? { type: "Script", statements: [] },
      stdout: result.stdout,
      fs,
      cwd,
      commandsRun,
      operatorsUsed,
      lineCommands: result.commandNames,
      lineOperators: result.operators,
      submissions,
    };

    const { winCondition } = level;
    const astOk =
      !result.blocked &&
      (winCondition.requiredOperators ?? []).every((op) => result.operators.includes(op)) &&
      (winCondition.requiredCommands ?? []).every((name) => result.commandNames.includes(name));

    if (solvedAt === -1 && astOk && winCondition.check(args)) solvedAt = index;
  });

  return { solvedAt, fs, cwd, commandsRun, operatorsUsed };
}

/* ------------------------- The catalog-wide contract ---------------------- */

test("the catalog loads and every level has rules", () => {
  assert.ok(LEVELS.length > 0, "no levels loaded from content/levels");
  assert.deepEqual(
    LEVELS.map((level) => level.id),
    LEVELS.map((_, index) => index + 1),
    "level ids must be contiguous and start at 1",
  );
});

for (const level of LEVELS) {
  const label = `level ${level.id} (${level.title})`;

  test(`${label}: every canonical solution solves it`, () => {
    assert.ok(level.solutions.length > 0, "a level must ship at least one solution");
    for (const solution of level.solutions) {
      const { solvedAt } = play(level, solution);
      assert.notEqual(
        solvedAt,
        -1,
        `solution did not solve the level: ${solution.join(" ; ")}`,
      );
    }
  });

  test(`${label}: no near miss solves it`, () => {
    for (const attempt of level.nearMisses) {
      const { solvedAt } = play(level, attempt);
      assert.equal(solvedAt, -1, `near miss wrongly solved the level: ${attempt.join(" ; ")}`);
    }
  });

  test(`${label}: every near miss gets a diagnostic or a shell error`, () => {
    for (const attempt of level.nearMisses) {
      let fs = clone(level.fileTree);
      let cwd = level.startingPath;
      let prevCwd: string | null = null;
      const commandsRun: string[] = [];
      const operatorsUsed: string[] = [];
      const submissions: Submission[] = [];
      let answered = false;

      for (const line of attempt) {
        const before = cwd;
        const result = evaluate({ input: line, fs, cwd, prevCwd, level });
        if (!result.blocked && result.ast && result.status !== "error") {
      submissions.push({ script: result.ast, cwd: before });
    }
        fs = result.fs;
        cwd = result.cwd;
        prevCwd = result.prevCwd;
        for (const name of result.commandNames) {
          if (!commandsRun.includes(name)) commandsRun.push(name);
        }
        for (const op of result.operators) {
          if (!operatorsUsed.includes(op)) operatorsUsed.push(op);
        }

        const args: WinCheckArgs = {
          ast: result.ast ?? { type: "Script", statements: [] },
          stdout: result.stdout,
          fs,
          cwd,
          commandsRun,
          operatorsUsed,
          lineCommands: result.commandNames,
          lineOperators: result.operators,
          submissions,
        };

        if (result.status === "error") answered = true;
        if ((level.diagnostics ?? []).some((diagnostic) => diagnostic.when(args))) answered = true;
      }

      assert.ok(
        answered,
        `near miss left the player with no feedback at all: ${attempt.join(" ; ")}`,
      );
    }
  });

  test(`${label}: lesson, prompt and hints are authored`, () => {
    assert.ok(level.lesson.trim().length > 120, "lesson body looks too short to teach anything");
    assert.ok(level.prompt.trim().length > 0);
    assert.ok(level.hints.length > 0, "every level needs at least one hint");
    assert.ok(Object.keys(level.focus).length > 0, "every level needs at least one focus command");
    assert.doesNotMatch(level.successMessage, /^\s*$/);
  });

  test(`${label}: every allowed command is implemented and documented`, () => {
    for (const name of Object.keys(level.allowedCommands)) {
      assert.ok(isKnownCommand(name), `\`${name}\` is unlocked but not implemented`);
      assert.ok(TLDR_PAGES[name], `\`${name}\` is unlocked but has no tldr page`);
    }
  });

  test(`${label}: the solution only uses commands the player has unlocked`, () => {
    for (const solution of level.solutions) {
      for (const line of solution) {
        const result = evaluate({
          input: line,
          fs: clone(level.fileTree),
          cwd: level.startingPath,
          prevCwd: null,
          level,
        });
        assert.ok(!result.blocked, `guardrails blocked a canonical solution line: ${line}`);
      }
    }
  });
}

/* -------------------------------- Chapters -------------------------------- */

test("chapter indices are unique and contiguous", () => {
  const indices = CHAPTERS.map((chapter) => chapter.index);
  assert.deepEqual(indices, [...indices].sort((a, b) => a - b));
  assert.equal(new Set(indices).size, indices.length);
});

test("every ready chapter has levels, and planned chapters have none", () => {
  for (const { chapter, levels } of levelsByChapter(LEVELS)) {
    if (chapter.status === "ready") {
      assert.ok(levels.length > 0, `chapter \`${chapter.id}\` is ready but has no levels`);
    } else {
      assert.equal(levels.length, 0, `chapter \`${chapter.id}\` is planned but has levels`);
    }
  }
});

test("every unlocked command across the curriculum is implemented", () => {
  for (const chapter of CHAPTERS) {
    for (const name of chapter.unlocks) {
      assert.ok(isKnownCommand(name), `chapter \`${chapter.id}\` unlocks unimplemented \`${name}\``);
    }
  }
});
