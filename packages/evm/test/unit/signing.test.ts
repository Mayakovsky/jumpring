import { describe, it, expect } from 'vitest';
import { Buffer } from 'node:buffer';
import { recoverTransactionAddress, recoverTypedDataAddress } from 'viem';
import { addressFromPrivateKey, signTransaction, signTypedData } from '../../src/index.js';

const KAT_PRIVATE_KEY = 'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

describe('signTransaction', () => {
  it('produces a signature that recovers to the signer address', async () => {
    const key = Buffer.from(KAT_PRIVATE_KEY, 'hex');
    const signer = addressFromPrivateKey(key);
    const serialized = await signTransaction(key, {
      type: 'eip1559',
      chainId: 1,
      nonce: 0,
      to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      value: 0n,
      maxFeePerGas: 1_000_000_000n,
      maxPriorityFeePerGas: 1_000_000_000n,
      gas: 21000n,
    });
    const recovered = await recoverTransactionAddress({
      serializedTransaction: serialized as `0x02${string}`,
    });
    expect(recovered).toBe(signer);
  });
});

describe('signTypedData', () => {
  it('produces a signature that recovers to the signer address', async () => {
    const key = Buffer.from(KAT_PRIVATE_KEY, 'hex');
    const signer = addressFromPrivateKey(key);
    const typedData = {
      domain: { name: 'jumpring', version: '1', chainId: 1 },
      types: { Msg: [{ name: 'contents', type: 'string' }] },
      primaryType: 'Msg' as const,
      message: { contents: 'hello' },
    };
    const signature = await signTypedData(key, typedData);
    const recovered = await recoverTypedDataAddress({ ...typedData, signature });
    expect(recovered).toBe(signer);
  });
});
