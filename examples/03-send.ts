// 03 — send a transaction on Base Sepolia (the path behind `jumpring evm send`).
//
// Broadcasts a zero-value self-transfer from a keystore and prints the receipt.
// The keystore must hold a Base Sepolia address that has been funded from a
// faucet. Usage:
//
//   JUMPRING_EXAMPLE_PASSPHRASE='...' npx tsx examples/03-send.ts <keyfile>
//
// The keystore here is a disposable testnet throwaway — never a mainnet key.

import { readFileSync } from 'node:fs';
import { parseKeystore, zero } from '@jumpring/core';
import {
  accountFromPrivateKey,
  makePublicClient,
  makeWalletClient,
  sendTransaction,
  unlockKeystore,
} from '@jumpring/evm';

const RPC = 'https://sepolia.base.org';
const CHAIN_ID = 84532; // Base Sepolia

async function main(): Promise<void> {
  const keyfile = process.argv[2];
  const passphrase = process.env.JUMPRING_EXAMPLE_PASSPHRASE ?? '';
  if (!keyfile) {
    throw new Error(
      'usage: npx tsx examples/03-send.ts <keyfile>  (JUMPRING_EXAMPLE_PASSPHRASE in env)',
    );
  }

  const parsed = parseKeystore(readFileSync(keyfile, 'utf8'));
  const unlocked = await unlockKeystore(parsed, passphrase);
  try {
    const account = accountFromPrivateKey(unlocked.keyBytes);
    const wallet = makeWalletClient(CHAIN_ID, RPC, account);
    const publicClient = makePublicClient(CHAIN_ID, RPC);

    console.log('zero-value self-transfer from', unlocked.address);
    const { hash, receipt } = await sendTransaction(wallet, publicClient, account, {
      to: unlocked.address,
      data: '0x',
      value: 0n,
    });
    console.log('tx hash: ', hash);
    console.log('status:  ', receipt.status, '(block', `${receipt.blockNumber})`);
  } finally {
    zero(unlocked.keyBytes);
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
