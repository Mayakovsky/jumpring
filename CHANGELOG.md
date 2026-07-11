# Changelog

All notable changes to jumpring are recorded here. This project follows semantic
versioning, where an on-disk keystore format change is a major bump.

## 0.1.0 — 2026-07-11

Initial release.

- **`@jumpring/core`** — Argon2id + AES-256-GCM encrypted keystore (JSON v1), EFF
  diceware passphrase generation (CSPRNG / auto / manual dice), best-effort memory zeroing,
  and a masked-by-default passphrase prompt with an `--echo` opt-in.
- **`@jumpring/evm`** — viem RPC clients and broadcast, address derivation and
  keystore unlock-and-verify, and offline transaction and typed-data signing.
- **`jumpring`** — the CLI: `genphrase`, `genkey`, `address`, `confirm`, and the
  `evm` subcommands (`sign-tx`, `sign-typed`, `read`, `send`).
