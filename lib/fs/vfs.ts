import type { VDir, VFile, VirtualFileSystem, VNode } from "@/lib/types";

/* ------------------------------ Path helpers ------------------------------ */

export const HOME = "/home/shelly";

/** Collapse ".", ".." and duplicate slashes in an absolute path. */
export function normalize(path: string): string {
  const parts: string[] = [];
  for (const segment of path.split("/")) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") {
      parts.pop();
      continue;
    }
    parts.push(segment);
  }
  return "/" + parts.join("/");
}

/** Resolve a user-supplied path against the current working directory. */
export function resolve(cwd: string, path: string): string {
  if (path === "" || path === undefined) return normalize(cwd);
  let expanded = path;
  if (expanded === "~") expanded = HOME;
  else if (expanded.startsWith("~/")) expanded = HOME + expanded.slice(1);
  if (expanded.startsWith("/")) return normalize(expanded);
  return normalize(cwd + "/" + expanded);
}

export function basename(path: string): string {
  const n = normalize(path);
  if (n === "/") return "/";
  return n.slice(n.lastIndexOf("/") + 1);
}

export function dirname(path: string): string {
  const n = normalize(path);
  if (n === "/") return "/";
  const cut = n.lastIndexOf("/");
  return cut === 0 ? "/" : n.slice(0, cut);
}

/** Replace `/home/shelly` with `~` for display. */
export function displayPath(path: string): string {
  const n = normalize(path);
  if (n === HOME) return "~";
  if (n.startsWith(HOME + "/")) return "~" + n.slice(HOME.length);
  return n;
}

/* ------------------------------ Node lookups ------------------------------ */

export function isDir(node: VNode | null): node is VDir {
  return node !== null && node.type === "dir";
}

export function isFile(node: VNode | null): node is VFile {
  return node !== null && node.type === "file";
}

/** Walk an absolute path. Returns null when any segment is missing. */
export function lookup(fs: VirtualFileSystem, absPath: string): VNode | null {
  const segments = normalize(absPath).split("/").filter(Boolean);
  let node: VNode = fs;
  for (const segment of segments) {
    if (node.type !== "dir") return null;
    const next: VNode | undefined = node.children[segment];
    if (!next) return null;
    node = next;
  }
  return node;
}

export function exists(fs: VirtualFileSystem, absPath: string): boolean {
  return lookup(fs, absPath) !== null;
}

export function readFile(fs: VirtualFileSystem, absPath: string): string | null {
  const node = lookup(fs, absPath);
  return isFile(node) ? node.content : null;
}

/**
 * Directory entries, sorted the way `ls` sorts them: alphabetically,
 * ignoring a leading dot so `.env` sits next to `env`.
 */
export function listDir(dir: VDir, { all = false }: { all?: boolean } = {}): string[] {
  return Object.keys(dir.children)
    .filter((name) => all || !name.startsWith("."))
    .sort((a, b) =>
      a.replace(/^\./, "").localeCompare(b.replace(/^\./, ""), "en", { numeric: true }),
    );
}

/* -------------------------------- Mutations ------------------------------- */

export function clone(fs: VirtualFileSystem): VirtualFileSystem {
  return structuredClone(fs);
}

/** Get the parent directory of an absolute path, or null if it is not one. */
function parentDir(fs: VirtualFileSystem, absPath: string): VDir | null {
  const parent = lookup(fs, dirname(absPath));
  return isDir(parent) ? parent : null;
}

export function mkdir(fs: VirtualFileSystem, absPath: string): VDir | null {
  const parent = parentDir(fs, absPath);
  if (!parent) return null;
  const name = basename(absPath);
  if (parent.children[name]) return null;
  const dir: VDir = { type: "dir", children: {} };
  parent.children[name] = dir;
  return dir;
}

export function mkdirp(fs: VirtualFileSystem, absPath: string): VDir | null {
  const segments = normalize(absPath).split("/").filter(Boolean);
  let node: VDir = fs;
  for (const segment of segments) {
    const next: VNode | undefined = node.children[segment];
    if (!next) {
      const dir: VDir = { type: "dir", children: {} };
      node.children[segment] = dir;
      node = dir;
    } else if (next.type === "dir") {
      node = next;
    } else {
      return null;
    }
  }
  return node;
}

/** Create an empty file, or leave an existing one untouched (like `touch`). */
export function touch(fs: VirtualFileSystem, absPath: string): boolean {
  const parent = parentDir(fs, absPath);
  if (!parent) return false;
  const name = basename(absPath);
  if (!parent.children[name]) parent.children[name] = { type: "file", content: "" };
  return true;
}

export function writeFile(
  fs: VirtualFileSystem,
  absPath: string,
  content: string,
  { append = false }: { append?: boolean } = {},
): boolean {
  const parent = parentDir(fs, absPath);
  if (!parent) return false;
  const name = basename(absPath);
  const existing = parent.children[name];
  if (existing && existing.type === "dir") return false;
  const previous = existing && existing.type === "file" ? existing.content : "";
  parent.children[name] = { type: "file", content: append ? previous + content : content };
  return true;
}

/* ------------------------------- ASCII tree ------------------------------- */

export interface TreeLine {
  /** The box-drawing prefix, e.g. "│   ├── ". */
  prefix: string;
  name: string;
  kind: "dir" | "file";
  /** Absolute path, used as a stable React key. */
  path: string;
  /** True when the entry was created after the level started. */
  isNew?: boolean;
}

/**
 * Render a directory as the lines of an ASCII tree. The root line is included
 * by the caller so it can be styled independently.
 */
export function treeLines(
  dir: VDir,
  rootPath: string,
  { all = true, indent = "" }: { all?: boolean; indent?: string } = {},
): TreeLine[] {
  const names = listDir(dir, { all });
  const lines: TreeLine[] = [];

  names.forEach((name, index) => {
    const last = index === names.length - 1;
    const node = dir.children[name];
    const path = rootPath === "/" ? "/" + name : rootPath + "/" + name;
    lines.push({
      prefix: indent + (last ? "└── " : "├── "),
      name,
      kind: node.type,
      path,
    });
    if (node.type === "dir") {
      lines.push(
        ...treeLines(node, path, { all, indent: indent + (last ? "    " : "│   ") }),
      );
    }
  });

  return lines;
}

/** Every absolute path contained in a filesystem, for new-entry diffing. */
export function allPaths(dir: VDir, rootPath = ""): string[] {
  const paths: string[] = [];
  for (const name of Object.keys(dir.children)) {
    const node = dir.children[name];
    const path = rootPath + "/" + name;
    paths.push(path);
    if (node.type === "dir") paths.push(...allPaths(node, path));
  }
  return paths;
}
