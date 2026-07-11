// Passphrase-generation orchestration: resolve the effective mode, then produce
// words via CSPRNG or manual dice entry. All I/O is injected so this is fully
// unit-testable without a TTY.

import { collectDiceWords } from './dice-input.js';
import { generateWords } from './csprng.js';
import { isNonTtyAutoFallback, resolveMode } from './modes.js';
import type { ModeFlags } from './modes.js';
import { loadWordlist } from './wordlist.js';

export const WORD_COUNT = 6;

export interface GenphraseOptions {
  auto?: boolean;
  dice?: boolean;
}

/**
 * Resolve and produce the passphrase words for the given flags.
 * `ask` and `chooseManual` are injected so this is fully unit-testable.
 *
 * `chooseManual` is consulted only in interactive mode: it decides between the
 * default CSPRNG path ([Enter]) and the manual dice path ([d]).
 */
export async function runGenphrase(
  opts: GenphraseOptions,
  io: {
    isTty: boolean;
    ask?: (q: string) => Promise<string>;
    chooseManual?: () => Promise<boolean>;
    warn?: (msg: string) => void;
  },
): Promise<string[]> {
  const flags: ModeFlags = { auto: opts.auto, dice: opts.dice, isTty: io.isTty };
  const mode = resolveMode(flags); // throws on --auto + --dice
  const { byCode } = loadWordlist();

  if (isNonTtyAutoFallback(flags)) {
    io.warn?.('stdin is not a TTY; defaulting to --auto (CSPRNG) generation.');
  }

  if (mode === 'auto') {
    return generateWords(byCode, WORD_COUNT);
  }

  if (mode === 'dice') {
    if (!io.ask) throw new Error('Manual dice entry requires an interactive prompt');
    return collectDiceWords(byCode, io.ask, WORD_COUNT);
  }

  // interactive: offer CSPRNG (default) or manual dice
  const wantsManual = io.chooseManual ? await io.chooseManual() : false;
  if (wantsManual) {
    if (!io.ask) throw new Error('Manual dice entry requires an interactive prompt');
    return collectDiceWords(byCode, io.ask, WORD_COUNT);
  }
  return generateWords(byCode, WORD_COUNT);
}
