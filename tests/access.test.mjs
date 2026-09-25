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
  assert.match(plans, /Prioridade na separação do pedido/);
  assert.match(plans, /FAST PASS — APENAS 50 VAGAS/);
  assert.match(plans, /Antecedência mínima de 6 horas/);
  assert.match(plans, /Grupo exclusivo para até 50 membros/);
  assert.match(plans, /Pedido com antecedência mínima de 24 horas/);
  assert.doesNotMatch(plans, /Ofertas exclusivas|Condições especiais/);
  assert.match(checkout, /api\('\/subscriptions\/upgrade'/);
});

test('the atendimento table displays each customer plan', () => {
  const atendimento = readFileSync(new URL('../src/pages/Atendimento.tsx', import.meta.url), 'utf8');
  assert.match(atendimento, /<th>Plano<\/th>/);
  assert.match(atendimento, /row\.subscription\?\.plan\?\.name/);
});

test('Basic customers can start an upgrade from their dashboard', () => {
  const dashboard = readFileSync(new URL('../src/pages/CustomerDashboard.tsx', import.meta.url), 'utf8');
  assert.match(dashboard, /subscription\.plan\?\.code === 'LAUNCH'/);
  assert.match(dashboard, /Fazer upgrade para o Plano Prioridade/);
  assert.match(dashboard, /sessionStorage\.setItem\('selected_plan'/);
});

test('rules distinguish Basic and Priority without advertising expired cashback', () => {
  const rules = readFileSync(new URL('../src/pages/Rules.tsx', import.meta.url), 'utf8');
  assert.match(rules, /Plano Basic: R\$ 149,97\/mês/);
  assert.match(rules, /Plano Prioridade: R\$ 297,97\/mês/);
  assert.match(rules, /separação e envio no mesmo dia/);
  assert.match(rules, /não garante a aquisição, disponibilidade ou inclusão/);
  assert.match(rules, /PRIORIDADE[\s\S]*<strong>6H<\/strong>/);
  assert.doesNotMatch(rules, /⏱️ 24H|⚡ 6H/);
  assert.doesNotMatch(rules, /cashback|entrega no mesmo dia/i);
});
