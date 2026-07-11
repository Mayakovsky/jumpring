# jumpring

A jump ring is the link that joins a clasp to a chain, a gem to a necklace.

`jumpring` joins agents to chains.  A small, auditable command-line tool that holds encrypted keys and uses them to sign and send.

### Generate EVM wallets without middlemen.  No browser, no wallet popups, no accounts.  Keep your keys off everyone else's servers. Generate strong passphrases from real dice if you want.

One job handled plainly.  Generate a passphrase, encrypt a private key into a keystore, derive its address, and sign or broadcast EVM transactions.   

A Swiss Army knife for independent Agent action on the chains.  You set the guardrails.


## Install

```
npm install -g jumpring
```

Requires Node 20 or newer. Installation builds one small native dependency (`argon2`), so a working build toolchain is expected on the install machine.

## Commands

| Command | What it does | Example |
|---|---|---|
| `genphrase` | Generate a 6-word EFF diceware passphrase | `jumpring genphrase --auto` |
| `genkey` | Generate a private key and write an encrypted keystore | `jumpring genkey --out key.json` |
| `address` | Decrypt a keystore and print its address | `jumpring address --keyfile key.json` |
| `confirm` | Prompt for a YES confirmation; exit 0 if confirmed, 1 otherwise | `jumpring confirm` |
| `evm sign-tx` | Sign a serializable transaction offline | `jumpring evm sign-tx --keyfile key.json --json-file tx.json` |
| `evm sign-typed` | Sign an EIP-712 typed-data payload offline | `jumpring evm sign-typed --keyfile key.json --json-file typed.json` |
| `evm read` | Perform a read-only eth_call | `jumpring evm read --chain-id 84532 --to 0x… --data 0x…` |
| `evm send` | Send a pre-encoded transaction and await the receipt | `jumpring evm send --keyfile key.json --chain-id 84532 --to 0x… --data 0x…` |

Every command prints its own `--help`. Passphrase-taking commands read a masked prompt by default; `--echo` makes entry visible, and non-interactive callers can pipe the passphrase on stdin. `evm read` / `evm send` take an RPC URL via `--rpc-url` or the `JUMPRING_RPC_URL` environment variable.

## Threat model

jumpring is a single-key, cold-custody CLI for operators who are comfortable at a terminal. It is deliberately **not**:

- a dapp bridge or `window.ethereum` provider
- WalletConnect, or any browser wallet
- multi-sig or MPC
- a hardware-wallet frontend
- custodial anything

Passphrase entry is **masked by default** (no keystroke echo); pass `--echo` to make it visible in a trusted, non-shoulder-surfable setting. A key lives in an Argon2id + AES-256-GCM keystore on disk and nowhere else; buffers holding key material are zeroed after use (best-effort — JavaScript runtimes may retain copies during garbage collection).

jumpring is a 0.x release and has not yet had an external security audit; read the code, it's small.

## Packages

jumpring is three small packages:

- **`@jumpring/core`** — the keystore, key-derivation, diceware, and passphrase prompt. **Zero chain dependencies** — a keystore library you can audit without reading a line of chain code.
- **`@jumpring/evm`** — RPC, account derivation, and signing over a jumpring keystore. This is the only package that pulls in `viem`.
- **`jumpring`** — the command-line interface, wiring the two together.

## Scope

v0.1.0 is **EVM-only** (other chains may come later, additively), **CLI-only** (no docs site — this README and `--help` are the documentation), and does not migrate wallets from other tools. Its surface is intentionally small.

## License

MIT. See [LICENSE](./LICENSE).
