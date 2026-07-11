import { EventEmitter } from 'node:events';
import { describe, it, expect } from 'vitest';
import {
  promptNewPassphrase,
  promptPassphrase,
  readMasked,
} from '../../src/prompt/passphrase.js';

function queuedReader(answers: string[]): (q: string) => Promise<string> {
  let i = 0;
  return () => Promise.resolve(answers[i++] ?? '');
}

// A fake raw-mode stdin that emits keystrokes on demand, plus a capturing
// stdout, so the masking behavior is testable without a real terminal.
function fakeTty() {
  const stdin = new EventEmitter();
  Object.assign(stdin, {
    isRaw: false,
    setRawMode(mode: boolean) {
      (stdin as unknown as { isRaw: boolean }).isRaw = mode;
    },
    resume() {},
    pause() {},
    setEncoding() {},
  });
  const written: string[] = [];
  const stdout = {
    write(s: string) {
      written.push(s);
      return true;
    },
  };
  return { stdin, stdout, written };
}

const ENTER = '\n';
const DEL = String.fromCharCode(127);

describe('readMasked', () => {
  it('reads a line without echoing keystrokes', async () => {
    const { stdin, stdout, written } = fakeTty();
    const p = readMasked(
      'Passphrase: ',
      stdin as unknown as NodeJS.ReadStream,
      stdout as unknown as NodeJS.WriteStream,
    );
    stdin.emit('data', 'hunter2 correct horse');
    stdin.emit('data', ENTER);
    await expect(p).resolves.toBe('hunter2 correct horse');
    const out = written.join('');
    expect(out).toContain('Passphrase: ');
    expect(out).not.toContain('hunter2'); // masking: input is never echoed
  });

  it('honors backspace', async () => {
    const { stdin, stdout } = fakeTty();
    const p = readMasked(
      'P: ',
      stdin as unknown as NodeJS.ReadStream,
      stdout as unknown as NodeJS.WriteStream,
    );
    stdin.emit('data', 'abc');
    stdin.emit('data', DEL); // delete 'c'
    stdin.emit('data', ENTER);
    await expect(p).resolves.toBe('ab');
  });
});

describe('promptPassphrase', () => {
  it('returns the entered line via an injected reader (masked default path)', async () => {
    const read = queuedReader(['correct horse battery staple inkwell radish']);
    await expect(promptPassphrase('Passphrase: ', { read })).resolves.toBe(
      'correct horse battery staple inkwell radish',
    );
  });

  it('supports the opt-in echo path via an injected reader', async () => {
    const read = queuedReader(['visible entry here please']);
    await expect(promptPassphrase('Passphrase: ', { echo: true, read })).resolves.toBe(
      'visible entry here please',
    );
  });
});

describe('promptNewPassphrase', () => {
  it('rejects mismatched entries', async () => {
    const read = queuedReader(['entry-one', 'entry-two-different']);
    await expect(promptNewPassphrase({ read })).rejects.toThrow('Passphrases do not match');
  });

  it('returns the passphrase when both entries match', async () => {
    const read = queuedReader(['same phrase six words go here', 'same phrase six words go here']);
    await expect(promptNewPassphrase({ read })).resolves.toBe('same phrase six words go here');
  });
});
