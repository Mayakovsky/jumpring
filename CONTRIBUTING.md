# Contributing to jumpring

Thanks for looking. jumpring is maintained **best-effort** by a small team, with a deliberately narrow scope. That shapes what we can take.

## What we accept

- **Security fixes** — always welcome, and see [SECURITY.md](./SECURITY.md) for how to report a vulnerability privately first.
- **Bug fixes** — a clear reproduction and a fix, with a test that would have caught it.
- **Documentation improvements** — corrections, clarity, better examples.

## What we don't accept

- **New features.** jumpring is intentionally small; feature PRs will be declined, however good.
- **New chain modules.** Support for additional chains is maintainer-initiated only.
- **Anything UI- or dapp-bridge-shaped** — browser wallets, `window.ethereum`, WalletConnect, connect buttons. jumpring is a terminal tool for operators and will stay one.

Opening an issue to discuss before a larger PR is always fine, and often the fastest path.

## What counts as a breaking change

So you know what a major version means:

- A change to the **on-disk keystore JSON format** is a **major** version bump. A keystore written by one major is readable by later releases of that major.
- Adding a CLI or API surface is a **minor** bump.
- Fixes are **patch** releases.

## Working on the code

```
pnpm install
pnpm typecheck
pnpm lint
pnpm run test    # vitest run
pnpm build
```

Keep changes small and covered by a test. `@jumpring/core` has no chain dependencies — please keep it that way; anything that reaches for `viem` belongs in `@jumpring/evm`.
