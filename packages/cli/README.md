# jumpring

The `jumpring` command-line interface — encrypted key custody and EVM chain operations. See the [top-level README](https://github.com/Mayakovsky/jumpring#readme) for the full picture and threat model.

```
npm install -g jumpring
```

## Commands

| Command | Description |
|---|---|
| `genphrase` | Generate a 6-word EFF diceware passphrase |
| `genkey` | Generate a private key and write an encrypted keystore |
| `address` | Decrypt a keystore and print its address |
| `confirm` | Prompt for a YES confirmation; exit 0 if confirmed, 1 otherwise |
| `evm sign-tx` | Sign a serializable transaction offline |
| `evm sign-typed` | Sign an EIP-712 typed-data payload offline |
| `evm read` | Perform a read-only eth_call |
| `evm send` | Send a pre-encoded transaction and await the receipt |

Run `jumpring <command> --help` for options. Passphrase prompts are masked by default; `--echo` makes entry visible, and a passphrase can be piped on stdin for non-interactive use. `evm read` / `evm send` resolve their RPC URL from `--rpc-url` or `JUMPRING_RPC_URL`.

## License

MIT.
