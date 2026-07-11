# @jumpring/core

The chain-agnostic core of [jumpring](https://jumpring.cc): an encrypted keystore, key derivation, EFF diceware passphrase generation, memory hygiene, and a masked passphrase prompt. **Zero chain dependencies** — nothing here knows what a chain is, which makes it a keystore library you can audit on its own.

```
npm install @jumpring/core
```

## The keystore format is a contract

A jumpring keystore is a small JSON document. The format is stable and versioned: an on-disk format change is a **major** version bump (see Versioning). The fields:

```json
{
  "version": 1,
  "address": "0x…",
  "kdf":    { "name": "argon2id", "memory": 262144, "iterations": 4, "parallelism": 1, "salt": "<base64>" },
  "cipher": { "name": "aes-256-gcm", "nonce": "<base64>", "auth_tag": "<base64>" },
  "ciphertext": "<base64>"
}
```

- **Key derivation:** Argon2id, memory 262144 KiB (256 MiB), iterations 4, parallelism 1, deriving a 32-byte key from a passphrase and a 16-byte random salt.
- **Encryption:** AES-256-GCM with a 12-byte nonce and a 16-byte authentication tag. Decryption fails loudly if the tag does not verify.
- **Address:** stored as an opaque string. The core never derives an address from the key — that belongs to a layer that owns the chain math (see `@jumpring/evm`).

## Test vectors

The crypto layer's behavior is pinned by known-answer tests you can read and re-run — the cheapest trust signal a keys library can offer. See the test files:

- `test/unit/crypto.test.ts` — Argon2id determinism and parameters, AES-256-GCM round-trip and tamper detection.
- `test/unit/keystore.test.ts` — keystore round-trip, parameter pinning, validation failures.
- `test/unit/diceware.test.ts` and `test/unit/wordlist.test.ts` — passphrase generation and the wordlist digest.

The EFF large wordlist shipped in `data/eff_large_wordlist.txt` is pinned to SHA-256 `addd35536511597a02fa0a9ff1e5284677b8883b83e986e43f15a3db996b903e`; the loader verifies this digest on every load and refuses a mismatch.

## Versioning

- On-disk keystore JSON **format** change → **major**.
- CLI/API surface addition → minor.
- Fixes → patch.

A keystore written by one major version is guaranteed readable by later releases of that major.

## License

MIT.
