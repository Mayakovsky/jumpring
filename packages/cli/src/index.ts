#!/usr/bin/env node
// jumpring — a small CLI for encrypted key custody and EVM chain operations.
// Thin commander wiring over @jumpring/core and @jumpring/evm.

import { realpathSync } from 'node:fs';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import { addressAction } from './commands/address.js';
import { confirmYes } from './commands/confirm.js';
import { genkeyAction } from './commands/genkey.js';
import { genphraseAction } from './commands/genphrase.js';
import {
  evmReadAction,
  evmSendAction,
  evmSignTxAction,
  evmSignTypedAction,
} from './commands/evm.js';

export function buildProgram(): Command {
  const program = new Command();
  program
    .name('jumpring')
    .description('A small CLI for encrypted key custody and EVM chain operations.')
    .version('0.1.0');

  program
    .command('genphrase')
    .description('Generate a 6-word EFF diceware passphrase')
    .option('--auto', 'non-interactive CSPRNG generation')
    .option('--dice', 'force interactive manual dice entry')
    .action((opts: { auto?: boolean; dice?: boolean }) => genphraseAction(opts));

  program
    .command('genkey')
    .description('Generate a private key and write an encrypted keystore')
    .requiredOption('--out <file>', 'output keystore path')
    .option('--echo', 'echo passphrase keystrokes (default: masked)')
    .action((opts: { out: string; echo?: boolean }) => genkeyAction(opts));

  program
    .command('address')
    .description('Decrypt a keystore and print its address')
    .requiredOption('--keyfile <file>', 'keystore path')
    .option('--reveal-private', 'also print the private key (DANGEROUS)')
    .option('--echo', 'echo passphrase keystrokes (default: masked)')
    .action((opts: { keyfile: string; revealPrivate?: boolean; echo?: boolean }) =>
      addressAction(opts),
    );

  program
    .command('confirm')
    .description('Prompt for a YES confirmation; exit 0 if confirmed, 1 otherwise')
    .option('--prompt <text>', 'confirmation prompt', 'Type YES to confirm: ')
    .action(async (opts: { prompt?: string }) => {
      const ok = await confirmYes(opts.prompt);
      process.stdout.write(ok ? 'confirmed\n' : 'not confirmed\n');
      if (!ok) process.exitCode = 1;
    });

  const evm = program.command('evm').description('EVM signing and RPC operations');

  evm
    .command('sign-tx')
    .description('Sign a serializable transaction offline')
    .requiredOption('--keyfile <file>', 'keystore path')
    .option('--json <string>', 'transaction JSON')
    .option('--json-file <path>', 'transaction JSON file')
    .option('--echo', 'echo passphrase keystrokes (default: masked)')
    .action((opts: { keyfile: string; json?: string; jsonFile?: string; echo?: boolean }) =>
      evmSignTxAction(opts),
    );

  evm
    .command('sign-typed')
    .description('Sign an EIP-712 typed-data payload offline')
    .requiredOption('--keyfile <file>', 'keystore path')
    .option('--json <string>', 'typed-data JSON')
    .option('--json-file <path>', 'typed-data JSON file')
    .option('--echo', 'echo passphrase keystrokes (default: masked)')
    .action((opts: { keyfile: string; json?: string; jsonFile?: string; echo?: boolean }) =>
      evmSignTypedAction(opts),
    );

  evm
    .command('read')
    .description('Perform a read-only eth_call')
    .requiredOption('--chain-id <n>', 'chain id')
    .requiredOption('--to <addr>', 'target address')
    .requiredOption('--data <hex>', 'encoded call data')
    .option('--rpc-url <url>', 'RPC URL (else JUMPRING_RPC_URL)')
    .action((opts: { chainId: string; to: string; data: string; rpcUrl?: string }) =>
      evmReadAction(opts),
    );

  evm
    .command('send')
    .description('Send a pre-encoded transaction and await the receipt')
    .requiredOption('--keyfile <file>', 'keystore path')
    .requiredOption('--chain-id <n>', 'chain id')
    .requiredOption('--to <addr>', 'target address')
    .requiredOption('--data <hex>', 'encoded call data')
    .option('--value <wei>', 'value in wei')
    .option('--rpc-url <url>', 'RPC URL (else JUMPRING_RPC_URL)')
    .option('--echo', 'echo passphrase keystrokes (default: masked)')
    .action(
      (opts: {
        keyfile: string;
        chainId: string;
        to: string;
        data: string;
        value?: string;
        rpcUrl?: string;
        echo?: boolean;
      }) => evmSendAction(opts),
    );

  return program;
}

async function main(): Promise<void> {
  await buildProgram().parseAsync(process.argv);
}

function isMainModule(): boolean {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isMainModule()) {
  main().catch((err: unknown) => {
    process.stderr.write(`error: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exitCode = 1;
  });
}
