// Generic EVM signing over a decrypted keystore key: offline transaction and
// typed-data signing, plus a send path composing the rpc broadcast helper. Thin
// viem delegation — no new cryptography, no protocol vocabulary.

import { Buffer } from 'node:buffer';
import { toHex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import type {
  Account,
  Hex,
  PublicClient,
  TransactionReceipt,
  TransactionSerializable,
  TypedDataDefinition,
  WalletClient,
} from 'viem';
import type { PrivateKeyAccount } from 'viem/accounts';
import { sendAndAwait } from '../rpc/broadcast.js';
import type { RawTx } from '../rpc/broadcast.js';

/** Build a viem local account from raw private-key bytes. */
export function accountFromPrivateKey(keyBytes: Buffer): PrivateKeyAccount {
  return privateKeyToAccount(toHex(keyBytes));
}

/** Sign a serializable transaction offline; returns the raw signed-tx hex. */
export async function signTransaction(
  keyBytes: Buffer,
  tx: TransactionSerializable,
): Promise<Hex> {
  const account = privateKeyToAccount(toHex(keyBytes));
  return account.signTransaction(tx);
}

/** Sign an EIP-712 typed-data payload offline; returns the 65-byte signature. */
export async function signTypedData(
  keyBytes: Buffer,
  typedData: TypedDataDefinition,
): Promise<Hex> {
  const account = privateKeyToAccount(toHex(keyBytes));
  return account.signTypedData(typedData);
}

/** Send a pre-encoded transaction and await its receipt (composes rpc/broadcast). */
export async function sendTransaction(
  wallet: WalletClient,
  publicClient: PublicClient,
  account: Account,
  tx: RawTx,
): Promise<{ hash: Hex; receipt: TransactionReceipt }> {
  return sendAndAwait(wallet, publicClient, account, tx);
}
