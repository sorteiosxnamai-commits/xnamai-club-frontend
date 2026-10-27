// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }));
vi.mock('../src/api/client', () => ({ api: apiMock, money: (value: number) => String(value) }));
vi.mock('../src/components/PublicHeader', () => ({ PublicHeader: () => <header>Club</header> }));
import { CustomerDashboard } from '../src/pages/CustomerDashboard';
afterEach(() => { cleanup(); apiMock.mockReset(); });
for (const method of ['CREDIT_CARD', 'PIX_RECURRING'] as const) {
  test(`boleto dashboard opens ${method} payment with the existing account`, async () => {
    apiMock.mockImplementation(async (path: string) => {
      if (path === '/me/dashboard') return { subscription: { id: 'sub', status: 'CANCELLED', plan: { code: 'LAUNCH' } }, paymentMethod: { type: 'BOLETO' }, invoices: [] };
      if (path === '/plans') return [{ id: 'plan', code: 'LAUNCH' }];
      if (path === '/subscriptions/me') return { status: 'CANCELLED', gatewaySubscriptionId: 'sub_old' };
      throw new Error('Stopped before external navigation');
    });
    render(<MemoryRouter><CustomerDashboard /></MemoryRouter>);
    expect(await screen.findByText('Pagar mensalidade')).toBeTruthy();
    expect(screen.getByText(/Não é necessário se cadastrar novamente/)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: method === 'CREDIT_CARD' ? 'Pagar com cartão' : 'Pagar com PIX' }));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith('/subscriptions/checkout', {
      method: 'POST', body: JSON.stringify({ planId: 'plan', paymentMethodType: method, replaceBoleto: true }),
    }));
  });
}
