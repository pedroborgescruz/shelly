/**
 * A strict parser for the small YAML subset the level files use: scalars,
 * one level of nested maps, and lists of scalars. It throws on anything else
 * rather than guessing, so an authoring mistake fails loudly at build time
 * instead of rendering a level with a silently missing field.
 */

export type FrontmatterValue = string | string[] | Record<string, string>;
export type Frontmatter = Record<string, FrontmatterValue>;

export class FrontmatterError extends Error {}

/** Strip matching quotes and unescape the few sequences we allow. */
function scalar(raw: string): string {
  const text = raw.trim();
  if (
    (text.startsWith('"') && text.endsWith('"') && text.length > 1) ||
    (text.startsWith("'") && text.endsWith("'") && text.length > 1)
  ) {
    return text.slice(1, -1).replace(/\\(["'\\])/g, "$1");
  }
  return text;
}

export interface ParsedFile {
  data: Frontmatter;
  body: string;
}

export function parseFrontmatter(source: string, label = "level"): ParsedFile {
  const text = source.replace(/\r\n/g, "\n");

  if (!text.startsWith("---\n")) {
    throw new FrontmatterError(`${label}: file must start with a \`---\` frontmatter fence`);
  }

  const end = text.indexOf("\n---", 3);
  if (end === -1) {
    throw new FrontmatterError(`${label}: frontmatter fence is never closed`);
  }

  const head = text.slice(4, end + 1).split("\n");
  const body = text.slice(end + 4).replace(/^\n+/, "");

  const data: Frontmatter = {};
  let currentKey: string | null = null;

  for (const [lineNumber, line] of head.entries()) {
    if (line.trim() === "" || line.trimStart().startsWith("#")) continue;

    const where = `${label}:${lineNumber + 2}`;
    const indented = /^\s/.test(line);

    if (!indented) {
      const match = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line);
      if (!match) throw new FrontmatterError(`${where}: expected \`key: value\`, got \`${line}\``);

      const [, key, rest] = match;
      if (key in data) throw new FrontmatterError(`${where}: duplicate key \`${key}\``);

      if (rest.trim() === "") {
        // A block follows; its first child decides whether it is a list or map.
        currentKey = key;
        continue;
      }

      data[key] = scalar(rest);
      currentKey = null;
      continue;
    }

    if (currentKey === null) {
      throw new FrontmatterError(`${where}: indented line does not belong to any key`);
    }

    const child = line.trim();

    if (child.startsWith("- ")) {
      const existing = data[currentKey];
      if (existing === undefined) data[currentKey] = [];
      else if (!Array.isArray(data[currentKey])) {
        throw new FrontmatterError(`${where}: \`${currentKey}\` already holds a map, not a list`);
      }
      (data[currentKey] as string[]).push(scalar(child.slice(2)));
      continue;
    }

    const entry = /^([A-Za-z][\w.-]*):\s*(.*)$/.exec(child);
    if (!entry) throw new FrontmatterError(`${where}: expected \`key: value\` or \`- item\``);

    const existing = data[currentKey];
    if (existing === undefined) data[currentKey] = {};
    else if (Array.isArray(existing) || typeof existing === "string") {
      throw new FrontmatterError(`${where}: \`${currentKey}\` already holds a ${
        Array.isArray(existing) ? "list" : "scalar"
      }, not a map`);
    }
    (data[currentKey] as Record<string, string>)[entry[1]] = scalar(entry[2]);
  }

  return { data, body: body.trimEnd() + "\n" };
}

/* ----------------------------- Typed accessors ---------------------------- */

export function requireString(data: Frontmatter, key: string, label: string): string {
  const value = data[key];
  if (typeof value !== "string" || value === "") {
    throw new FrontmatterError(`${label}: \`${key}\` must be a non-empty string`);
  }
  return value;
}

export function requireNumber(data: Frontmatter, key: string, label: string): number {
  const value = requireString(data, key, label);
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) throw new FrontmatterError(`${label}: \`${key}\` must be a number`);
  return parsed;
}

export function requireList(data: Frontmatter, key: string, label: string): string[] {
  const value = data[key];
  if (!Array.isArray(value) || value.length === 0) {
    throw new FrontmatterError(`${label}: \`${key}\` must be a non-empty list`);
  }
  return value;
}

export function requireMap(data: Frontmatter, key: string, label: string): Record<string, string> {
  const value = data[key];
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new FrontmatterError(`${label}: \`${key}\` must be a map`);
  }
  return value;
}
