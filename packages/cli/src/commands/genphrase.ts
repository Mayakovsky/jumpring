// `genphrase`: 6-word EFF diceware passphrase. The generation logic lives in
// @jumpring/core; this wires stdin/TTY and prints one space-separated line.

import process from 'node:process';
import { makeStdinPrompter, runGenphrase } from '@jumpring/core';
import type { GenphraseOptions } from '@jumpring/core';

/** CLI action: wire stdin prompts, print one space-separated line. */
export async function genphraseAction(opts: GenphraseOptions): Promise<void> {
  const isTty = Boolean(process.stdin.isTTY);
  let prompter: { ask: (q: string) => Promise<string>; close: () => void } | undefined;

  const ask = (q: string): Promise<string> => {
    if (!prompter) prompter = makeStdinPrompter();
    return prompter.ask(q);
  };

  const chooseManual = async (): Promise<boolean> => {
    const choice = (await ask('[Enter]=CSPRNG generate, [d]=manual dice entry: '))
      .trim()
      .toLowerCase();
    return choice === 'd';
  };

  try {
    const words = await runGenphrase(opts, {
      isTty,
      ask,
      chooseManual,
      warn: (m) => process.stderr.write(`${m}\n`),
    });
    process.stdout.write(`${words.join(' ')}\n`);
  } finally {
    prompter?.close();
  }
}
