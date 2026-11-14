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

test('a cancelled boleto account pays again on Asaas by card, boleto, or pix', async () => {
  apiMock.mockImplementation(async (path: string) => {
    if (path === '/me/dashboard') return {
      subscription: { id: 'sub', status: 'CANCELLED', plan: { code: 'LAUNCH' } },
      paymentMethod: { type: 'BOLETO' },
      invoices: [],
      access: { active: false },
    };
    if (path === '/subscriptions/payment-link') throw new Error('link conferido');
    throw new Error(`unexpected ${path}`);
  });
  render(<MemoryRouter><CustomerDashboard /></MemoryRouter>);
  expect(await screen.findByRole('button', { name: /Pagar com cartão/ })).toBeTruthy();
  expect(screen.getByRole('button', { name: /Pagar com boleto/ })).toBeTruthy();
  expect(screen.getByRole('button', { name: /Pagar com PIX/ })).toBeTruthy();
  await userEvent.click(screen.getByRole('button', { name: /Pagar com boleto/ }));
  await waitFor(() => expect(apiMock).toHaveBeenCalledWith('/subscriptions/payment-link', {
    method: 'POST', body: JSON.stringify({ code: 'LAUNCH', method: 'BOLETO' }),
  }));
  expect((await screen.findByRole('alert')).textContent).toMatch(/link conferido/);
});
