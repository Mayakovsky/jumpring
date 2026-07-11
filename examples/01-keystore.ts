// 01 — keystore round-trip, fully offline.
//
// Generates a private key, encrypts it into a jumpring keystore, then decrypts
// it back and confirms the derived address matches. No network. The keystore
// lives in a temp directory and is deleted at the end.

import { randomBytes } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { encryptKeystore, parseKeystore, zero } from '@jumpring/core';
import { addressFromPrivateKey, unlockKeystore } from '@jumpring/evm';

async function main(): Promise<void> {
  const dir = mkdtempSync(join(tmpdir(), 'jumpring-example-'));
  const keyfile = join(dir, 'key.json');
  const passphrase = 'example throwaway passphrase words';

  try {
    const keyBytes = randomBytes(32);
    const address = addressFromPrivateKey(keyBytes);
    const keystore = await encryptKeystore({ keyBytes, address, passphrase });
    zero(keyBytes);
    writeFileSync(keyfile, `${JSON.stringify(keystore, null, 2)}\n`, { mode: 0o600 });
    console.log('wrote encrypted keystore for', address);

    const parsed = parseKeystore(readFileSync(keyfile, 'utf8'));
    const unlocked = await unlockKeystore(parsed, passphrase);
    try {
      console.log('unlocked address     ', unlocked.address);
      console.log('round-trip matches:  ', unlocked.address === address);
    } finally {
      zero(unlocked.keyBytes);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
