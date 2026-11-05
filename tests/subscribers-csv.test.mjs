import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSubscribersCsv } from '../src/pages/subscribers-csv.ts';

test('subscriber export lists name, email, phone, plan, amount, frequency and next charge', () => {
  const csv = buildSubscribersCsv([
    {
      gatewaySubscriptionId: 'sub_123',
      currentPeriodEnd: '2026-12-04T03:00:00.000Z',
      plan: { name: 'Plano Basic', monthlyPriceCents: 14997 },
      customer: { name: 'Mayck Philippe', email: 'mayck@example.com', phone: '(11) 98888-7777' },
    },
    {
      gatewaySubscriptionId: null,
      currentPeriodEnd: null,
      plan: { name: 'Plano Prioridade', monthlyPriceCents: 29797 },
      customer: { name: 'Loja "A"; B', email: 'loja@example.com', phone: null },
    },
  ]);

  assert.match(csv, /^\uFEFFNome;E-mail;Telefone;Plano;Valor;Frequência;Próxima cobrança\n/);
  assert.match(csv, /Mayck Philippe;mayck@example.com;\(11\) 98888-7777;Plano Basic;R\$\s?149,97;Mensal;/);
  assert.match(csv, /"Loja ""A""; B";loja@example.com;;Plano Prioridade;R\$\s?297,97;Avulsa;/);
});
