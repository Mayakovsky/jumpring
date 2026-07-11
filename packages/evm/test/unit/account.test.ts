import { describe, it, expect } from 'vitest';
import { Buffer } from 'node:buffer';
import { randomBytes } from 'node:crypto';
import { encryptKeystore } from '@jumpring/core';
import { addressFromPrivateKey, privateKeyHex, unlockKeystore } from '../../src/index.js';

// Well-known public test vector (the standard local-dev account #0). This key is
// published in every Ethereum dev toolchain — no secret material here.
const KAT_PRIVATE_KEY = 'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const KAT_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const PASSPHRASE = 'six word passphrase goes here now';

describe('addressFromPrivateKey', () => {
  it('derives the known address for a known key (KAT)', () => {
    const key = Buffer.from(KAT_PRIVATE_KEY, 'hex');
    expect(addressFromPrivateKey(key)).toBe(KAT_ADDRESS);
  });
});

describe('unlockKeystore', () => {
  it('round-trips a keystore and verifies the derived address', async () => {
    const key = Buffer.from(KAT_PRIVATE_KEY, 'hex');
    const address = addressFromPrivateKey(key);
    const ks = await encryptKeystore({ keyBytes: key, address, passphrase: PASSPHRASE });
    const unlocked = await unlockKeystore(ks, PASSPHRASE);
    try {
      expect(unlocked.address).toBe(KAT_ADDRESS);
      expect(privateKeyHex(unlocked.keyBytes)).toBe(`0x${KAT_PRIVATE_KEY}`);
    } finally {
      unlocked.keyBytes.fill(0);
    }
  });

  it('throws when the stored address does not match the key', async () => {
    const key = randomBytes(32);
    const ks = await encryptKeystore({
      keyBytes: key,
      address: '0x0000000000000000000000000000000000000000',
      passphrase: PASSPHRASE,
    });
    await expect(unlockKeystore(ks, PASSPHRASE)).rejects.toThrow(/integrity check failed/i);
  });
});
