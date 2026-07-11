// `genkey`: generate a private key and encrypt it to a keystore.

import { Buffer } from 'node:buffer';
import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import process from 'node:process';
import { encryptKeystore, promptNewPassphrase, zero } from '@jumpring/core';
import { addressFromPrivateKey } from '@jumpring/evm';
import type { Address } from '@jumpring/evm';

export interface GenkeyResult {
  address: Address;
  keystoreJson: string;
}

/**
 * Generate a fresh 32-byte private key, derive its address, and encrypt the key
 * into a keystore JSON string. The raw key buffer is zeroed before return — the
 * plaintext key never leaves this function.
 *
 * `getPassphrase` is injected so this is unit-testable without a TTY.
 */
export async function runGenkey(getPassphrase: () => Promise<string>): Promise<GenkeyResult> {
  const keyBytes = randomBytes(32);
  try {
    const address = addressFromPrivateKey(keyBytes);
    const passphrase = await getPassphrase();
    const keystore = await encryptKeystore({ keyBytes, address, passphrase });
    return { address, keystoreJson: `${JSON.stringify(keystore, null, 2)}\n` };
  } finally {
    zero(keyBytes);
  }
}

/** CLI action: prompt passphrase, write the keystore, print the address. */
export async function genkeyAction(opts: { out: string; echo?: boolean }): Promise<void> {
  const { address, keystoreJson } = await runGenkey(() =>
    promptNewPassphrase({ echo: opts.echo }),
  );
  // Encryption completes fully in-memory before any disk write: the raw key is
  // never written to disk, only its encrypted form.
  writeFileSync(opts.out, Buffer.from(keystoreJson, 'utf8'), { mode: 0o600 });
  process.stdout.write(`Keystore written to ${opts.out}\n`);
  process.stdout.write(`Address: ${address}\n`);
}
