// manual dice code entry: validation + interactive prompt loop.

import process from 'node:process';
import { createInterface } from 'node:readline';

/** A dice code must be exactly 5 characters, each a digit 1..6. */
export function isValidDiceCode(code: string): boolean {
  if (code.length !== 5) return false;
  for (let i = 0; i < 5; i++) {
    const c = code.charCodeAt(i);
    // '1' = 49 .. '6' = 54
    if (c < 49 || c > 54) return false;
  }
  return true;
}

/**
 * Resolve a single dice code to its word, throwing a descriptive error if the
 * code is malformed or absent from the list.
 */
export function codeToWord(byCode: Map<string, string>, code: string): string {
  if (!isValidDiceCode(code)) {
    throw new Error(
      `Invalid dice code "${code}": must be 5 digits, each between 1 and 6`,
    );
  }
  const word = byCode.get(code);
  if (word === undefined) {
    throw new Error(`No word for code ${code}`);
  }
  return word;
}

type LinePrompter = (query: string) => Promise<string>;

/**
 * Create a stdin-backed prompter. On a TTY it prompts line-by-line via readline
 * (interactive dice entry). On non-TTY stdin (piped/redirected) it buffers all
 * lines once and serves them sequentially, so scripted input is not lost between
 * prompts.
 */
export function makeStdinPrompter(): { ask: LinePrompter; close: () => void } {
  if (process.stdin.isTTY) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const ask: LinePrompter = (query) => new Promise((resolve) => rl.question(query, resolve));
    return { ask, close: () => rl.close() };
  }
  let lines: string[] | undefined;
  let idx = 0;
  const load = (): Promise<string[]> =>
    new Promise((resolve) => {
      const rl = createInterface({ input: process.stdin });
      const acc: string[] = [];
      rl.on('line', (l) => acc.push(l));
      rl.on('close', () => resolve(acc));
    });
  const ask: LinePrompter = async (query) => {
    process.stdout.write(query);
    if (lines === undefined) lines = await load();
    const line = lines[idx] ?? '';
    idx += 1;
    // Strip a leading BOM (Windows-piped input can carry one).
    return line.charCodeAt(0) === 0xfeff ? line.slice(1) : line;
  };
  return { ask, close: () => {} };
}

/**
 * Interactively collect `count` words via manual dice entry.
 * Re-prompts on invalid input for the SAME word; accepted words are never
 * re-rolled. The prompter is injected so this is unit-testable.
 */
export async function collectDiceWords(
  byCode: Map<string, string>,
  ask: LinePrompter,
  count = 6,
): Promise<string[]> {
  const words: string[] = [];
  for (let i = 0; i < count; i++) {
    for (;;) {
      const raw = (await ask(`word ${i + 1}/${count} — enter 5 dice digits (1-6): `)).trim();
      if (!isValidDiceCode(raw)) {
        process.stderr.write(
          `  rejected "${raw}": need exactly 5 digits, each 1-6. try again.\n`,
        );
        continue;
      }
      const word = byCode.get(raw);
      if (word === undefined) {
        process.stderr.write(`  no word for "${raw}". try again.\n`);
        continue;
      }
      words.push(word);
      break;
    }
  }
  return words;
}
