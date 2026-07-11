# Security Policy

## Reporting a vulnerability

Please report security issues **privately**, not in a public issue.

Use this repository's **GitHub Security Advisories** ("Report a vulnerability" under the Security tab) to open a private report. That keeps the details between you and the maintainers until a fix is available.

Please include enough to reproduce: affected version, steps, and impact.

## What to expect

jumpring is maintained best-effort by a small team. There is **no bug bounty**. We will acknowledge a valid report, work a fix as a priority consistent with its severity, and credit you in the release notes if you would like.

## Scope

jumpring is a single-key, cold-custody CLI. The security surface that matters most: the keystore format and its cryptography (`@jumpring/core`), and the signing paths (`@jumpring/evm`). It is explicitly **not** a browser wallet, dapp bridge, multi-sig, MPC, or custodial service — reports about those are out of scope because those surfaces do not exist here.

Keys are held in an Argon2id + AES-256-GCM keystore on disk. jumpring never transmits a key or passphrase anywhere; passphrase entry is masked by default.
