import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateResetPassword } from '../src/pages/recovery-form.ts';

test('reset form requires eight matching characters', () => {
  assert.equal(validateResetPassword('1234567', '1234567'), 'A senha deve ter pelo menos 8 caracteres.');
  assert.equal(validateResetPassword('12345678', 'different'), 'As senhas não coincidem.');
  assert.equal(validateResetPassword('12345678', '12345678'), '');
});

test('recovery pages are public and login offers the entry point', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const login = readFileSync(new URL('../src/pages/AuthPage.tsx', import.meta.url), 'utf8');
  assert.match(app, /path="\/esqueci-senha"/);
  assert.match(app, /path="\/redefinir-senha"/);
  assert.match(login, /Esqueci minha senha/);
});

test('reset token is removed from the visible URL before the app renders', async () => {
  let visibleUrl = '';
  globalThis.window = {
    location: { pathname: '/redefinir-senha', href: `https://club.example/redefinir-senha?token=${'a'.repeat(64)}` },
    history: { state: null, replaceState: (_state, _title, next) => { visibleUrl = next; } },
  };
  try {
    const { getResetToken, clearResetToken } = await import(`../src/recovery-token.ts?test=${Date.now()}`);
    assert.equal(getResetToken(), 'a'.repeat(64));
    assert.equal(visibleUrl, '/redefinir-senha');
    clearResetToken();
    assert.equal(getResetToken(), '');
  } finally {
    delete globalThis.window;
  }
});
