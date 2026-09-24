import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { accessFor } from '../src/auth/roles.ts';

test('the /atendimento route is public', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(app, /<Route path="\/atendimento" element=\{<Atendimento \/>\} \/>/);
  assert.doesNotMatch(app, /path="\/atendimento" element=\{<Protected/);
});

test('Protected delegates to accessFor (single RBAC decision)', () => {
  const protectedSource = readFileSync(new URL('../src/components/Protected.tsx', import.meta.url), 'utf8');
  assert.match(protectedSource, /accessFor\(user, allowed\)/);
});

test('priority plan exposes its benefits and uses the Stripe upgrade flow', () => {
  const plans = readFileSync(new URL('../src/pages/Plans.tsx', import.meta.url), 'utf8');
  const checkout = readFileSync(new URL('../src/pages/Checkout.tsx', import.meta.url), 'utf8');
  assert.match(plans, /plan\.code === 'PRIORITY'/);
  assert.match(plans, /Prioridade nos pedidos/);
  assert.match(checkout, /api\('\/subscriptions\/upgrade'/);
});
