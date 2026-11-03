import type { VirtualFileSystem } from "@/lib/types";
import { dir, file, homeAt } from "./fsBuilders";
import { ACCESS_LOG, APP_LOG, NAMES } from "./data";

/**
 * Shared starting worlds.
 *
 * A chapter reuses one map so the player learns the terrain once and can spend
 * their attention on the command instead of re-reading the tree every level.
 * Each call returns a fresh tree, since levels mutate theirs.
 */

/** Chapter 1: a home directory with somewhere to go and something to find. */
export function orientationWorld(): VirtualFileSystem {
  return homeAt({
    ".bashrc": file("export EDITOR=vim\n"),
    ".gitconfig": file("[user]\n\tname = shelly\n"),
    "README.md": file("# shelly\n\nA sandbox. Nothing here can break.\n"),
    notes: dir({
      "missing-semester.md": file("Lecture 1: the shell.\n"),
    }),
    projects: dir({
      "hello.sh": file('echo "hello from the shell"\n'),
      logs: dir({}),
      web: dir({
        "index.html": file("<h1>hello</h1>\n"),
        src: dir({
          "app.ts": file("export const name = 'shelly';\n"),
          "util.ts": file("export const noop = () => {};\n"),
        }),
      }),
    }),
  });
}

/** Chapter 3 and 5: a project with logs worth reading. */
export function logsWorld(): VirtualFileSystem {
  return homeAt({
    projects: dir({
      "README.md": file("# shelly\n\nRun it, read the logs, fix the bug.\n"),
      "hello.sh": file('echo "hello from the shell"\n'),
      logs: dir({
        "app.log": file(APP_LOG),
        "access.log": file(ACCESS_LOG),
      }),
    }),
  });
}

/** Chapter 5: logs plus a small list with deliberate repeats. */
export function pipesWorld(): VirtualFileSystem {
  return homeAt({
    projects: dir({
      "names.txt": file(NAMES),
      "hello.sh": file('echo "hello from the shell"\n'),
      logs: dir({
        "app.log": file(APP_LOG),
        "access.log": file(ACCESS_LOG),
      }),
    }),
  });
}
