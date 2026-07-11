// `address`: decrypt a keystore, assert integrity, print the address.
//
// The decrypt-and-assert (derived address === stored address) lives in
// @jumpring/evm because it needs viem; @jumpring/core stores the address opaquely.

import { readFileSync } from 'node:fs';
import process from 'node:process';
import { parseKeystore, promptPassphrase, zero } from '@jumpring/core';
import { privateKeyHex, unlockKeystore } from '@jumpring/evm';
import type { Address } from '@jumpring/evm';

/** Decrypt a keystore object and return the verified address (zeros the key). */
export async function runAddress(
  keystoreObj: unknown,
  passphrase: string,
  revealPrivate = false,
): Promise<{ address: Address; privateKey?: `0x${string}` }> {
  const unlocked = await unlockKeystore(keystoreObj, passphrase);
  try {
    const out: { address: Address; privateKey?: `0x${string}` } = { address: unlocked.address };
    if (revealPrivate) {
      out.privateKey = privateKeyHex(unlocked.keyBytes);
    }
    return out;
  } finally {
    zero(unlocked.keyBytes);
  }
}

/** CLI action. */
export async function addressAction(opts: {
  keyfile: string;
  revealPrivate?: boolean;
  echo?: boolean;
}): Promise<void> {
  const keystore = parseKeystore(readFileSync(opts.keyfile, 'utf8'));
  const passphrase = await promptPassphrase('Passphrase: ', { echo: opts.echo });
  const { address, privateKey } = await runAddress(keystore, passphrase, opts.revealPrivate);
  process.stdout.write(`Address: ${address}\n`);
  if (privateKey) {
    process.stdout.write('\n!!! WARNING — PRIVATE KEY REVEALED BELOW — DO NOT SHARE !!!\n');
    process.stdout.write(`${privateKey}\n`);
    process.stdout.write('!!! Clear your terminal scrollback now. !!!\n');
  }
}
