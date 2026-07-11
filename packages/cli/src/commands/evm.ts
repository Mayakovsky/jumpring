// `evm` subcommands: offline signing (sign-tx, sign-typed) and RPC operations
// (read, send). Thin wrappers over @jumpring/evm; no protocol vocabulary.

import { readFileSync } from 'node:fs';
import process from 'node:process';
import { promptPassphrase, zero } from '@jumpring/core';
import {
  accountFromPrivateKey,
  callRead,
  makePublicClient,
  makeWalletClient,
  resolveRpcUrl,
  sendTransaction,
  signTransaction,
  signTypedData,
  unlockKeystore,
} from '@jumpring/evm';
import type { TransactionSerializable, TypedDataDefinition, UnlockedKey } from '@jumpring/evm';

function loadJson(inline: string | undefined, file: string | undefined): unknown {
  if (inline) return JSON.parse(inline);
  if (file) return JSON.parse(readFileSync(file, 'utf8'));
  throw new Error('provide the payload via --json <string> or --json-file <path>');
}

// JSON has no bigint; coerce the numeric transaction fields viem expects as
// bigint (accepts decimal or 0x-hex strings, or numbers).
function coerceTxBigints(raw: unknown): TransactionSerializable {
  if (raw === null || typeof raw !== 'object') {
    throw new Error('transaction payload must be a JSON object');
  }
  const obj = { ...(raw as Record<string, unknown>) };
  const bigintFields = ['value', 'gas', 'gasPrice', 'maxFeePerGas', 'maxPriorityFeePerGas'];
  for (const field of bigintFields) {
    const v = obj[field];
    if (typeof v === 'string' || typeof v === 'number') obj[field] = BigInt(v);
  }
  return obj as unknown as TransactionSerializable;
}

async function unlock(keyfile: string, echo?: boolean): Promise<UnlockedKey> {
  const keystore = JSON.parse(readFileSync(keyfile, 'utf8')) as unknown;
  const passphrase = await promptPassphrase('Passphrase: ', { echo });
  return unlockKeystore(keystore, passphrase);
}

export async function evmSignTxAction(opts: {
  keyfile: string;
  json?: string;
  jsonFile?: string;
  echo?: boolean;
}): Promise<void> {
  const tx = coerceTxBigints(loadJson(opts.json, opts.jsonFile));
  const unlocked = await unlock(opts.keyfile, opts.echo);
  try {
    const signed = await signTransaction(unlocked.keyBytes, tx);
    process.stdout.write(`${signed}\n`);
  } finally {
    zero(unlocked.keyBytes);
  }
}

export async function evmSignTypedAction(opts: {
  keyfile: string;
  json?: string;
  jsonFile?: string;
  echo?: boolean;
}): Promise<void> {
  const typedData = loadJson(opts.json, opts.jsonFile) as TypedDataDefinition;
  const unlocked = await unlock(opts.keyfile, opts.echo);
  try {
    const signature = await signTypedData(unlocked.keyBytes, typedData);
    process.stdout.write(`${signature}\n`);
  } finally {
    zero(unlocked.keyBytes);
  }
}

export async function evmReadAction(opts: {
  chainId: string;
  to: string;
  data: string;
  rpcUrl?: string;
}): Promise<void> {
  const rpcUrl = resolveRpcUrl(opts.rpcUrl);
  const client = makePublicClient(Number(opts.chainId), rpcUrl);
  const result = await callRead(client, opts.to as `0x${string}`, opts.data as `0x${string}`);
  process.stdout.write(`${result}\n`);
}

export async function evmSendAction(opts: {
  keyfile: string;
  chainId: string;
  to: string;
  data: string;
  value?: string;
  rpcUrl?: string;
  echo?: boolean;
}): Promise<void> {
  const rpcUrl = resolveRpcUrl(opts.rpcUrl);
  const unlocked = await unlock(opts.keyfile, opts.echo);
  try {
    const account = accountFromPrivateKey(unlocked.keyBytes);
    const wallet = makeWalletClient(Number(opts.chainId), rpcUrl, account);
    const publicClient = makePublicClient(Number(opts.chainId), rpcUrl);
    const { hash, receipt } = await sendTransaction(wallet, publicClient, account, {
      to: opts.to as `0x${string}`,
      data: opts.data as `0x${string}`,
      value: opts.value ? BigInt(opts.value) : undefined,
    });
    process.stdout.write(`tx: ${hash}\nstatus: ${receipt.status}\n`);
  } finally {
    zero(unlocked.keyBytes);
  }
}
