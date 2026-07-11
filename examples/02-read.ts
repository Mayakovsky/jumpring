// 02 — read from Base Sepolia over the public RPC.
//
// Reads the chain id, the latest block number, and an address balance, then
// performs a raw eth_call (the path behind `jumpring evm read`). No key, no
// account, no funds required.

import { callRead, makePublicClient } from '@jumpring/evm';

const RPC = 'https://sepolia.base.org';
const CHAIN_ID = 84532; // Base Sepolia

// The canonical WETH predeploy — always present on OP-stack chains. Used here
// as a stable example address to read a balance and call a view function.
const EXAMPLE_ADDRESS = '0x4200000000000000000000000000000000000006';
const DECIMALS_SELECTOR = '0x313ce567'; // decimals()

async function main(): Promise<void> {
  const client = makePublicClient(CHAIN_ID, RPC);

  const chainId = await client.getChainId();
  const block = await client.getBlockNumber();
  const balance = await client.getBalance({ address: EXAMPLE_ADDRESS });
  console.log('chain id:     ', chainId);
  console.log('latest block: ', block);
  console.log('balance:      ', balance, 'wei', `(${EXAMPLE_ADDRESS})`);

  const raw = await callRead(client, EXAMPLE_ADDRESS, DECIMALS_SELECTOR);
  console.log('eth_call decimals():', BigInt(raw));
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
