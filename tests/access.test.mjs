import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ATENDIMENTO_ROLES, accessFor, homePath, isDeskRole } from '../src/auth/roles.ts';

const route = (name) => accessFor(name ? { role: name } : null, ATENDIMENTO_ROLES);

test('/atendimento: anonymous goes to login', () => {
  assert.deepEqual(route(null), { kind: 'login' });
});

test('/atendimento: CUSTOMER goes to its own home', () => {
  assert.deepEqual(route('CUSTOMER'), { kind: 'redirect', to: homePath('CUSTOMER') });
  assert.equal(homePath('CUSTOMER'), '/app');
});

test('/atendimento: SUPPORT and ADMIN see the desk', () => {
  assert.deepEqual(route('SUPPORT'), { kind: 'allow' });
  assert.deepEqual(route('ADMIN'), { kind: 'allow' });
});

test('the /atendimento route is wrapped by Protected with the desk roles', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(app, /<Route path="\/atendimento" element=\{<Protected roles=\{ATENDIMENTO_ROLES\}><Atendimento \/><\/Protected>\} \/>/);
  assert.doesNotMatch(app, /element=\{<Atendimento \/>\}/);
});

test('Protected delegates to accessFor (single RBAC decision)', () => {
  const protectedSource = readFileSync(new URL('../src/components/Protected.tsx', import.meta.url), 'utf8');
  assert.match(protectedSource, /accessFor\(user, allowed\)/);
});

test('SUPPORT flow: login lands on the desk it is allowed to open', () => {
  assert.equal(homePath('SUPPORT'), '/atendimento');
  assert.deepEqual(accessFor({ role: 'SUPPORT' }, ATENDIMENTO_ROLES), { kind: 'allow' });
  assert.equal(homePath('ADMIN'), '/admin');
  assert.ok(isDeskRole('SUPPORT') && isDeskRole('ADMIN') && !isDeskRole('CUSTOMER') && !isDeskRole(null));
});

test('the desk request carries the session token saved at login', () => {
  const auth = readFileSync(new URL('../src/auth/AuthContext.tsx', import.meta.url), 'utf8');
  const client = readFileSync(new URL('../src/api/client.ts', import.meta.url), 'utf8');
  assert.match(auth, /localStorage\.setItem\('xnamai_token', result\.token\)/);
  assert.match(client, /localStorage\.getItem\('xnamai_token'\)/);
  assert.match(client, /Authorization: `Bearer \$\{token\}`/);
});
