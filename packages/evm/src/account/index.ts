// Generic EVM account helpers: derive an address from a private key, expose the
// private-key hex, and unlock a jumpring keystore with a derive-and-assert
// integrity check. Thin viem delegation — no new cryptography, no protocol
// vocabulary.

import { Buffer } from 'node:buffer';
import { getAddress, toHex } from 'viem';
import { privateKeyToAddress } from 'viem/accounts';
import type { Address } from 'viem';
import { decryptKeystore, zero } from '@jumpring/core';

export interface UnlockedKey {
  /** Caller MUST zero this when done. */
  keyBytes: Buffer;
  address: Address;
}

/** Derive the checksummed EVM address for a 32-byte private key. */
export function addressFromPrivateKey(keyBytes: Buffer): Address {
  return privateKeyToAddress(toHex(keyBytes));
}

/** 0x-prefixed hex of a private-key buffer. */
export function privateKeyHex(keyBytes: Buffer): `0x${string}` {
  return toHex(keyBytes);
}

/**
 * Decrypt a keystore object and assert the stored address matches the address
 * derived from the recovered key. Throws on mismatch. On success the caller
 * owns `keyBytes` and is responsible for zeroing it.
 */
export async function unlockKeystore(
  keystoreObj: unknown,
  passphrase: string,
): Promise<UnlockedKey> {
  const { keyBytes, address } = await decryptKeystore(keystoreObj, passphrase);
  let derived: Address;
  try {
    derived = addressFromPrivateKey(keyBytes);
  } catch (e) {
    zero(keyBytes);
    throw e;
  }
  if (getAddress(derived) !== getAddress(address)) {
    zero(keyBytes);
    throw new Error(
      `Keystore integrity check failed: stored address ${address} != derived ${derived}`,
    );
  }
  return { keyBytes, address: getAddress(address) };
}
