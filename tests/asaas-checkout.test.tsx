// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }));
vi.mock('../src/api/client', async (original) => ({ ...await original<typeof import('../src/api/client')>(), api: apiMock }));
vi.mock('../src/components/PublicHeader', () => ({ PublicHeader: () => <header>Club</header> }));
vi.mock('../src/telemetry', () => ({ logAppEvent: vi.fn() }));
import { Checkout } from '../src/pages/Checkout';
afterEach(() => { cleanup(); sessionStorage.clear(); apiMock.mockReset(); });
for (const [code, card, pix, price] of [
  ['LAUNCH', 'dyt747auecm0y89b', 'o1ec2qy62xy2osok', '199,99'],
  ['PRIORITY', 'h0k06a6rr4d00swi', 'dh2huehi75bvitg5', '349,99'],
]) {
  test(`${code}: new subscription opens the correct Asaas links for each method`, async () => {
    sessionStorage.setItem('selected_plan', JSON.stringify({ id: 'plan', code, name: code, monthlyPriceCents: 1 }));
    apiMock.mockImplementation(async (path: string) => path === '/auth/me' ? { document: '04252011000110', companyName: 'Loja Teste' } : null);
    render(<MemoryRouter><Checkout /></MemoryRouter>);
    expect((await screen.findByRole('link', { name: /Pagar.*Asaas/ })).getAttribute('href')).toBe(`https://www.asaas.com/000/c/${card}`);
    await userEvent.click(screen.getByRole('button', { name: /PIX/ }));
    expect(screen.getByRole('link', { name: /Pagar.*Asaas/ }).getAttribute('href')).toBe(`https://www.asaas.com/000/c/${pix}`);
    expect(screen.getAllByText(new RegExp(price)).length).toBeGreaterThan(0);
    expect(apiMock.mock.calls.some(([, options]) => options?.method === 'POST')).toBe(false);
    expect(screen.getByText(/confirmação.*atendimento/i)).toBeTruthy();
  });
}

test('an existing subscription does not expose a second payment link', async () => {
  sessionStorage.setItem('selected_plan', JSON.stringify({ id: 'plan', code: 'LAUNCH' }));
  apiMock.mockImplementation(async (path: string) => path === '/auth/me' ? { document: '04252011000110', companyName: 'Loja Teste' } : { id: 'existing', status: 'ACTIVE', plan: { code: 'LAUNCH' } });
  render(<MemoryRouter><Checkout /></MemoryRouter>);
  expect(await screen.findByText('Você já possui uma assinatura em andamento')).toBeTruthy();
  expect(screen.queryByRole('link', { name: /Pagar.*Asaas/ })).toBeNull();
});

test('failure to check membership never exposes a new payment link', async () => {
  sessionStorage.setItem('selected_plan', JSON.stringify({ id: 'plan', code: 'LAUNCH' }));
  apiMock.mockRejectedValue(new Error('network unavailable'));
  render(<MemoryRouter><Checkout /></MemoryRouter>);
  expect((await screen.findByRole('alert')).textContent).toMatch(/verificar sua assinatura/);
  expect(screen.queryByRole('link', { name: /Pagar.*Asaas/ })).toBeNull();
});

test('when Fast Pass is full, the portal shows the rejection before navigating to payment', async () => {
  sessionStorage.setItem('selected_plan', JSON.stringify({ id: 'plan', code: 'PRIORITY' }));
  apiMock.mockImplementation(async (path: string) => {
    if (path === '/auth/me') return { document: '04252011000110', companyName: 'Loja Teste' };
    if (path === '/subscriptions/me') return null;
    throw new Error('As 50 vagas do Fast Pass estão ocupadas. Fale com o atendimento.');
  });
  render(<MemoryRouter><Checkout /></MemoryRouter>);
  await userEvent.click(await screen.findByRole('link', { name: /Pagar.*Asaas/ }));
  expect((await screen.findByRole('alert')).textContent).toMatch(/50 vagas/);
  expect(apiMock).toHaveBeenCalledWith('/subscriptions/payment-link', expect.objectContaining({ method: 'POST', body: JSON.stringify({ code: 'PRIORITY', method: 'CREDIT_CARD' }) }));
});


test('a legacy CPF account is sent to regularization before exposing a payment link', async () => {
  sessionStorage.setItem('selected_plan', JSON.stringify({ id: 'plan', code: 'LAUNCH' }));
  apiMock.mockImplementation(async (path: string) => path === '/auth/me' ? { document: '52998224725', companyName: 'Antiga' } : null);
  render(<MemoryRouter><Checkout /></MemoryRouter>);
  expect((await screen.findByRole('link', { name: 'Informar CNPJ da empresa' })).getAttribute('href')).toBe('/app/cadastro-empresa');
  expect(screen.queryByRole('link', { name: /Pagar.*Asaas/ })).toBeNull();
});
