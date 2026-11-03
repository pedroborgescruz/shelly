export interface TldrExample {
  /** What the example accomplishes, in plain language. */
  text: string;
  /** The command, with {{placeholders}} like the real tldr pages use. */
  command: string;
}

export interface TldrPage {
  name: string;
  description: string;
  examples: TldrExample[];
}

export const TLDR_PAGES: Record<string, TldrPage> = {
  pwd: {
    name: "pwd",
    description: "Print the path of the current working directory.",
    examples: [
      { text: "Print the current directory", command: "pwd" },
    ],
  },

  ls: {
    name: "ls",
    description: "List directory contents.",
    examples: [
      { text: "List files one per line, in the current directory", command: "ls" },
      { text: "Include hidden files (names beginning with a dot)", command: "ls -a" },
      { text: "Long format: permissions, owner, size", command: "ls -l" },
      { text: "Mark directories with a trailing slash", command: "ls -F" },
      { text: "List a specific directory", command: "ls {{path/to/directory}}" },
    ],
  },

  cd: {
    name: "cd",
    description: "Change the current working directory.",
    examples: [
      { text: "Go to a directory", command: "cd {{path/to/directory}}" },
      { text: "Go up one level", command: "cd .." },
      { text: "Go to your home directory", command: "cd ~" },
      { text: "Go back to the previous directory", command: "cd -" },
    ],
  },

  mkdir: {
    name: "mkdir",
    description: "Create directories.",
    examples: [
      { text: "Create a directory", command: "mkdir {{directory}}" },
      { text: "Create several at once", command: "mkdir {{dir1}} {{dir2}}" },
      {
        text: "Create missing parent directories along the way",
        command: "mkdir -p {{path/to/directory}}",
      },
    ],
  },

  touch: {
    name: "touch",
    description: "Create empty files, or update an existing file's timestamp.",
    examples: [
      { text: "Create an empty file", command: "touch {{filename}}" },
      { text: "Create several empty files", command: "touch {{file1}} {{file2}}" },
    ],
  },

  echo: {
    name: "echo",
    description: "Print text to standard output.",
    examples: [
      { text: "Print a line of text", command: "echo {{Hello world}}" },
      { text: "Print without the trailing newline", command: "echo -n {{text}}" },
      { text: "Write text into a file, replacing its contents", command: "echo {{text}} > {{file}}" },
      { text: "Append text to the end of a file", command: "echo {{text}} >> {{file}}" },
    ],
  },

  cat: {
    name: "cat",
    description: "Print and concatenate files.",
    examples: [
      { text: "Print a file's contents", command: "cat {{file}}" },
      { text: "Print several files, one after another", command: "cat {{file1}} {{file2}}" },
      { text: "Print with line numbers", command: "cat -n {{file}}" },
      { text: "Send a file's contents to another command", command: "cat {{file}} | {{command}}" },
    ],
  },

  grep: {
    name: "grep",
    description: "Find lines matching a pattern.",
    examples: [
      { text: "Search a file for a pattern", command: "grep {{pattern}} {{file}}" },
      { text: "Search text arriving on standard input", command: "{{command}} | grep {{pattern}}" },
      { text: "Ignore case while matching", command: "grep -i {{pattern}} {{file}}" },
      { text: "Show only the lines that do NOT match", command: "grep -v {{pattern}} {{file}}" },
      { text: "Prefix each result with its line number", command: "grep -n {{pattern}} {{file}}" },
      { text: "Count matching lines instead of printing them", command: "grep -c {{pattern}} {{file}}" },
    ],
  },

  wc: {
    name: "wc",
    description: "Count lines, words and bytes.",
    examples: [
      { text: "Count lines, words and bytes in a file", command: "wc {{file}}" },
      { text: "Count lines only", command: "wc -l {{file}}" },
      { text: "Count words only", command: "wc -w {{file}}" },
      { text: "Count the lines arriving on standard input", command: "{{command}} | wc -l" },
    ],
  },

  head: {
    name: "head",
    description: "Print the beginning of a file.",
    examples: [
      { text: "Print the first 10 lines", command: "head {{file}}" },
      { text: "Print the first N lines", command: "head -n {{5}} {{file}}" },
    ],
  },

  tail: {
    name: "tail",
    description: "Print the end of a file.",
    examples: [
      { text: "Print the last 10 lines", command: "tail {{file}}" },
      { text: "Print the last N lines", command: "tail -n {{5}} {{file}}" },
    ],
  },

  cp: {
    name: "cp",
    description: "Copy files and directories.",
    examples: [
      { text: "Copy a file to a new name", command: "cp {{file}} {{copy}}" },
      { text: "Copy a file into an existing directory", command: "cp {{file}} {{directory}}/" },
      { text: "Copy a directory and everything inside it", command: "cp -r {{directory}} {{copy}}" },
      { text: "Copy several files into a directory", command: "cp {{file1}} {{file2}} {{directory}}/" },
    ],
  },

  mv: {
    name: "mv",
    description: "Move or rename files and directories. One command, because renaming is moving.",
    examples: [
      { text: "Rename a file", command: "mv {{old}} {{new}}" },
      { text: "Move a file into a directory", command: "mv {{file}} {{directory}}/" },
      { text: "Move several files at once", command: "mv {{file1}} {{file2}} {{directory}}/" },
    ],
  },

  rm: {
    name: "rm",
    description: "Remove files and directories. There is no undo and no trash.",
    examples: [
      { text: "Remove a file", command: "rm {{file}}" },
      { text: "Remove a directory and everything in it", command: "rm -r {{directory}}" },
      { text: "Ignore files that do not exist", command: "rm -f {{file}}" },
    ],
  },

  sort: {
    name: "sort",
    description: "Sort lines of text.",
    examples: [
      { text: "Sort a file alphabetically", command: "sort {{file}}" },
      { text: "Sort numerically rather than as text", command: "sort -n {{file}}" },
      { text: "Reverse the order", command: "sort -r {{file}}" },
      { text: "Largest number first", command: "sort -rn {{file}}" },
      { text: "Sort and drop duplicates", command: "sort -u {{file}}" },
    ],
  },

  uniq: {
    name: "uniq",
    description: "Collapse repeated ADJACENT lines. Almost always used after sort.",
    examples: [
      { text: "Collapse runs of identical lines", command: "sort {{file}} | uniq" },
      { text: "Prefix each line with how many times it occurred", command: "sort {{file}} | uniq -c" },
      { text: "Show only the lines that repeated", command: "sort {{file}} | uniq -d" },
    ],
  },

  cut: {
    name: "cut",
    description: "Pull columns out of each line.",
    examples: [
      { text: "Take the first space-separated field", command: "cut -d ' ' -f 1 {{file}}" },
      { text: "Take several fields", command: "cut -d ',' -f {{1,3}} {{file}}" },
      { text: "Take a range of fields", command: "cut -d ':' -f {{2-4}} {{file}}" },
    ],
  },

  tr: {
    name: "tr",
    description: "Translate or delete characters. Reads standard input only.",
    examples: [
      { text: "Lowercase everything", command: "{{command}} | tr A-Z a-z" },
      { text: "Replace one character with another", command: "{{command}} | tr {{' '}} {{'\\n'}}" },
      { text: "Delete every matching character", command: "{{command}} | tr -d {{characters}}" },
    ],
  },

  tee: {
    name: "tee",
    description: "Write standard input to a file AND pass it along the pipe.",
    examples: [
      { text: "Save output and keep it flowing", command: "{{command}} | tee {{file}}" },
      { text: "Append instead of replacing", command: "{{command}} | tee -a {{file}}" },
    ],
  },

  tldr: {
    name: "tldr",
    description: "Show practical examples for a command — this very panel.",
    examples: [
      { text: "Look up a command", command: "tldr {{command}}" },
      { text: "List every page Shelly knows", command: "tldr --list" },
    ],
  },

  help: {
    name: "help",
    description: "Shelly's own meta commands.",
    examples: [
      { text: "Show the objective and the commands this level unlocks", command: "help" },
      { text: "Look up a command's examples", command: "tldr {{command}}" },
      { text: "Start the level over with a fresh filesystem", command: "reset" },
      { text: "Wipe the scrollback", command: "clear" },
    ],
  },
};

export function tldrPage(name: string): TldrPage | null {
  return TLDR_PAGES[name] ?? null;
}

export function tldrIndex(): string[] {
  return Object.keys(TLDR_PAGES).sort();
}
