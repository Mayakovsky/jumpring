# Examples

Three small scripts. Run them with any TypeScript-capable runner — for example
[`tsx`](https://tsx.is) via `npx tsx`, or Node 23+ directly. Build the packages
first (`pnpm build`) so the workspace imports resolve.

## 01 — keystore round-trip (offline)

```
npx tsx examples/01-keystore.ts
```

Generates a key, encrypts it into a keystore, decrypts it back, and confirms the
address round-trips. No network.

## 02 — read from Base Sepolia

```
npx tsx examples/02-read.ts
```

Reads chain id, latest block, an address balance, and a view function over the
public RPC (`https://sepolia.base.org`). No key or funds required.

## 03 — send on Base Sepolia

```
JUMPRING_EXAMPLE_PASSPHRASE='your passphrase' npx tsx examples/03-send.ts path/to/key.json
```

Broadcasts a zero-value self-transfer and prints the receipt. Requires a keystore
whose Base Sepolia address has been funded from a faucet. Use a **disposable
testnet keystore** — never a mainnet key.
