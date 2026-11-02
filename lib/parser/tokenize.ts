export type TokenType = "word" | "operator";

export interface Token {
  type: TokenType;
  value: string;
  /** True when the word came from inside quotes, so it is never split again. */
  quoted?: boolean;
}

export class ParseError extends Error {}

/** Longest-first so ">>" wins over ">" and "&&" over "&". */
const OPERATORS = [">>", "&&", "||", "|", ">", "<", ";"] as const;

const WHITESPACE = /\s/;

/**
 * Split a command line into words and operators, honouring single quotes,
 * double quotes and backslash escapes. Unterminated quotes throw, which the
 * terminal surfaces as a shell-style syntax error.
 */
export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  // The word currently being accumulated, plus whether it had any quotes at
  // all — `touch ""` must still produce an (empty) argument.
  let current = "";
  let started = false;
  let quoted = false;

  const flush = () => {
    if (!started) return;
    tokens.push({ type: "word", value: current, quoted });
    current = "";
    started = false;
    quoted = false;
  };

  while (index < input.length) {
    const char = input[index];

    if (char === "#" && !started) break; // comment to end of line

    if (WHITESPACE.test(char)) {
      flush();
      index += 1;
      continue;
    }

    if (char === "\\") {
      const next = input[index + 1];
      if (next === undefined) throw new ParseError("unexpected end of input after `\\`");
      current += next;
      started = true;
      index += 2;
      continue;
    }

    if (char === "'" || char === '"') {
      const close = input.indexOf(char, index + 1);
      if (close === -1) throw new ParseError(`unexpected EOF while looking for matching \`${char}\``);
      const body = input.slice(index + 1, close);
      // Double quotes keep backslash escapes; single quotes are literal.
      current += char === '"' ? body.replace(/\\(["$`\\])/g, "$1") : body;
      started = true;
      quoted = true;
      index = close + 1;
      continue;
    }

    const operator = OPERATORS.find((op) => input.startsWith(op, index));
    if (operator) {
      flush();
      tokens.push({ type: "operator", value: operator });
      index += operator.length;
      continue;
    }

    current += char;
    started = true;
    index += 1;
  }

  flush();
  return tokens;
}

/** Every distinct operator in a line — used by level win conditions. */
export function operatorsIn(tokens: Token[]): string[] {
  return [...new Set(tokens.filter((t) => t.type === "operator").map((t) => t.value))];
}
