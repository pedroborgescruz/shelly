import type { Command, PipelineNode, Pipeline, Redirect, Script } from "@/lib/types";
import { ParseError, tokenize, type Token } from "./tokenize";

export { ParseError } from "./tokenize";

/**
 * A deliberately small shell grammar, producing the same shape of AST a full
 * parser would for the constructs Shelly teaches:
 *
 *   script    := statement (";" statement)*
 *   statement := pipeline (("&&" | "||") pipeline)*
 *   pipeline  := command ("|" command)*
 *   command   := word+ redirect*
 *
 * Working on an AST rather than regexes is what lets a level accept
 * `cat log | grep ERROR` and `grep ERROR < log` as the same solution.
 */
export function parse(input: string): Script {
  const tokens = tokenize(input);
  const parser = new Parser(tokens);
  const script = parser.parseScript();
  return script;
}

class Parser {
  private index = 0;

  constructor(private readonly tokens: Token[]) {}

  private peek(): Token | undefined {
    return this.tokens[this.index];
  }

  private at(...values: string[]): boolean {
    const token = this.peek();
    return !!token && token.type === "operator" && values.includes(token.value);
  }

  private next(): Token | undefined {
    return this.tokens[this.index++];
  }

  parseScript(): Script {
    const statements: PipelineNode[] = [];
    while (this.index < this.tokens.length) {
      if (this.at(";")) {
        this.next();
        continue;
      }
      statements.push(this.parseStatement());
    }
    return { type: "Script", statements };
  }

  private parseStatement(): PipelineNode {
    let left: PipelineNode = this.parsePipeline();
    while (this.at("&&", "||")) {
      const op = this.next()!.value as "&&" | "||";
      const right = this.parsePipeline();
      left = { type: "LogicalExpression", op, left, right };
    }
    return left;
  }

  private parsePipeline(): Pipeline {
    const commands: Command[] = [this.parseCommand()];
    while (this.at("|")) {
      this.next();
      commands.push(this.parseCommand());
    }
    return { type: "Pipeline", commands };
  }

  private parseCommand(): Command {
    const words: string[] = [];
    const redirects: Redirect[] = [];

    while (this.index < this.tokens.length) {
      const token = this.peek()!;

      if (token.type === "operator") {
        if (token.value === ">" || token.value === ">>" || token.value === "<") {
          this.next();
          const target = this.peek();
          if (!target || target.type !== "word") {
            throw new ParseError("syntax error near unexpected token `newline`");
          }
          this.next();
          redirects.push({ type: "Redirect", op: token.value, file: target.value });
          continue;
        }
        break; // |, &&, ||, ; end this command
      }

      this.next();
      words.push(token.value);
    }

    if (words.length === 0) {
      throw new ParseError("syntax error near unexpected token `|`");
    }

    return { type: "Command", name: words[0], args: words.slice(1), redirects };
  }
}

/* ------------------------------ AST traversal ----------------------------- */

/** Flatten every Command node in a script, in source order. */
export function commandsIn(node: Script | PipelineNode): Command[] {
  if (node.type === "Script") return node.statements.flatMap(commandsIn);
  if (node.type === "LogicalExpression") return [...commandsIn(node.left), ...commandsIn(node.right)];
  return node.commands;
}

/** Command names used in a script, deduplicated. */
export function commandNamesIn(script: Script): string[] {
  return [...new Set(commandsIn(script).map((c) => c.name))];
}

/**
 * Operators present in the AST, including redirection operators pulled from
 * the commands they belong to.
 */
export function astOperators(node: Script | PipelineNode): string[] {
  const found: string[] = [];

  const walk = (n: Script | PipelineNode) => {
    if (n.type === "Script") {
      n.statements.forEach(walk);
      return;
    }
    if (n.type === "LogicalExpression") {
      found.push(n.op);
      walk(n.left);
      walk(n.right);
      return;
    }
    if (n.commands.length > 1) found.push("|");
    for (const command of n.commands) {
      for (const redirect of command.redirects) found.push(redirect.op);
    }
  };

  walk(node);
  return [...new Set(found)];
}
