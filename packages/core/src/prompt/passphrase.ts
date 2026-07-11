// Passphrase prompt over a TTY. Masked by default: keystrokes are NOT echoed to
// the terminal. Pass `{ echo: true }` (wired to the CLI `--echo` flag) to restore
// visible entry when you are in a trusted, non-shoulder-surfable environment.
// A `read` override is accepted for non-TTY callers and tests.

import process from 'node:process';
import { createInterface } from 'node:readline';

export interface PromptOptions {
  /** Echo keystrokes visibly instead of masking them. Default: false (masked). */
  echo?: boolean;
  /**
   * Injectable reader (tests / non-TTY callers). Receives the already-written
   * query and returns the entered line. When provided it fully overrides the
   * built-in TTY readers.
   */
  read?: (query: string) => Promise<string>;
}

/** Visible (echoing) line read via readline. */
export function readVisible(query: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise<string>((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Masked line read: writes the query, then reads keystrokes WITHOUT echoing
 * them. Handles Enter (submit), backspace, and Ctrl-C (cancel). The streams are
 * injectable so the masking behavior is unit-testable.
 */
export function readMasked(
  query: string,
  stdin: NodeJS.ReadStream = process.stdin,
  stdout: NodeJS.WriteStream = process.stdout,
): Promise<string> {
  stdout.write(query);
  return new Promise<string>((resolve, reject) => {
    const chars: string[] = [];
    const wasRaw = stdin.isRaw;
    if (typeof stdin.setRawMode === 'function') stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    const cleanup = (): void => {
      stdin.removeListener('data', onData);
      if (typeof stdin.setRawMode === 'function') stdin.setRawMode(wasRaw);
      stdin.pause();
    };

    const onData = (chunk: string): void => {
      for (const ch of chunk) {
        // Enter (LF/CR) or Ctrl-D submits the collected input.
        if (ch === '\n' || ch === '\r' || ch === '\u0004') {
          stdout.write('\n');
          cleanup();
          resolve(chars.join(''));
          return;
        }
        // Ctrl-C cancels.
        if (ch === '\u0003') {
          stdout.write('\n');
          cleanup();
          reject(new Error('Input cancelled'));
          return;
        }
        // Backspace (DEL / BS) removes the last collected character.
        if (ch === '\u007f' || ch === '\b') {
          if (chars.length > 0) chars.pop();
          continue;
        }
        // Collect printable input; ignore other control characters.
        if (ch >= ' ') chars.push(ch);
      }
    };

    stdin.on('data', onData);
  });
}

// Non-TTY input (piped or redirected): read stdin fully once, then hand out
// queued lines. Masking is meaningless without a terminal, and buffering the
// whole stream makes multiple sequential prompts work reliably.
let pipedLines: string[] | undefined;
let pipedIndex = 0;

function readPipedLines(): Promise<string[]> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin });
    const lines: string[] = [];
    rl.on('line', (line) => lines.push(line));
    rl.on('close', () => resolve(lines));
  });
}

async function nextPipedLine(): Promise<string> {
  if (pipedLines === undefined) pipedLines = await readPipedLines();
  const line = pipedLines[pipedIndex] ?? '';
  pipedIndex += 1;
  // Strip a leading BOM (Windows-piped input can carry one).
  return line.charCodeAt(0) === 0xfeff ? line.slice(1) : line;
}

/**
 * Prompt for a passphrase. On a TTY, masked by default (no keystroke echo);
 * pass `{ echo: true }` for visible entry. On non-TTY stdin (piped/redirected)
 * lines are read verbatim. A `{ read }` override wins over everything.
 */
export async function promptPassphrase(
  query = 'Passphrase: ',
  opts: PromptOptions = {},
): Promise<string> {
  if (opts.read) return opts.read(query);
  if (!process.stdin.isTTY) {
    process.stdout.write(query);
    const line = await nextPipedLine();
    process.stdout.write('\n');
    return line;
  }
  return opts.echo ? readVisible(query) : readMasked(query);
}

/**
 * Prompt twice and require the two entries to match (used when creating a new
 * keystore). Throws if they differ.
 */
export async function promptNewPassphrase(opts: PromptOptions = {}): Promise<string> {
  const first = await promptPassphrase('New passphrase: ', opts);
  const second = await promptPassphrase('Confirm passphrase: ', opts);
  if (first !== second) {
    throw new Error('Passphrases do not match');
  }
  return first;
}
