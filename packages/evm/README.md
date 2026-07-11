# @jumpring/evm

EVM RPC, account derivation, and signing for [jumpring](https://jumpring.cc), over a [`@jumpring/core`](https://www.npmjs.com/package/@jumpring/core) keystore. This is the one package that depends on [`viem`](https://viem.sh) — it is a thin delegation over viem's primitives, with no cryptography of its own.

```
npm install @jumpring/evm
```

## Surface

- **RPC:** `makePublicClient` / `makeWalletClient` build viem clients from a chain id and RPC URL; `callRead` performs a read-only `eth_call`; `sendAndAwait` broadcasts a pre-encoded transaction and waits for its receipt.
- **Account:** `addressFromPrivateKey` derives a checksummed address; `unlockKeystore` decrypts a jumpring keystore and asserts the derived address matches the stored one, throwing on mismatch.
- **Signing:** `signTransaction` and `signTypedData` sign offline against a decrypted key; `sendTransaction` composes the wallet client with the broadcast path.

## A note on deadlines

If you sign anything that carries a deadline — a permit, a typed-data authorization, an intent — treat the deadline as **short**. Contracts commonly cap signature deadlines far below intuition, and a signature broadcast after its deadline simply reverts. Use a short deadline and broadcast promptly. A far-future deadline is a footgun, not a safety margin: it widens the window in which a leaked signature stays valid, and buys you nothing.

## License

MIT.
