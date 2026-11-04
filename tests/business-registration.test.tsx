// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
const { auth } = vi.hoisted(() => ({ auth: { user: null as null | { document: string; companyName: string }, loading: false, login: vi.fn(), register: vi.fn(), updateBusiness: vi.fn() } }));
vi.mock('../src/auth/AuthContext', () => ({ useAuth: () => auth }));
vi.mock('../src/components/PublicHeader', () => ({ PublicHeader: () => <header>Club</header> }));
vi.mock('../src/telemetry', () => ({ logAppEvent: vi.fn() }));
import { AuthPage } from '../src/pages/AuthPage';
import { BusinessProfile } from '../src/pages/BusinessProfile';
beforeEach(() => { Element.prototype.scrollIntoView = vi.fn(); });
afterEach(() => { cleanup(); sessionStorage.clear(); auth.user = null; auth.register.mockReset(); auth.updateBusiness.mockReset(); });

function fillRegistration(document: string) {
  for (const [label, value] of [['Nome', 'Cliente Teste'], ['Empresa', 'Loja Teste'], ['Cidade', 'São Paulo'], ['CNPJ da empresa', document], ['E-mail', 'cliente@test.invalid'], ['Senha', 'SenhaTeste123!']]) {
    fireEvent.change(screen.getByLabelText(new RegExp(`^${label}`)), { target: { value } });
  }
  fireEvent.change(screen.getByLabelText('Estado', { exact: true }), { target: { value: 'SP' } });
}

test('CPF is refused on the registration screen before sending to the API', async () => {
  render(<MemoryRouter><AuthPage mode="register" /></MemoryRouter>);
  fillRegistration('52998224725');
  await userEvent.click(screen.getByRole('button', { name: 'Continuar para pagamento' }));
  expect((await screen.findByRole('alert')).textContent).toMatch(/CNPJ válido/);
  expect(auth.register).not.toHaveBeenCalled();
});

test('the registration form preserves letters in the alphanumeric CNPJ', async () => {
  auth.register.mockResolvedValue({ role: 'CUSTOMER' });
  render(<MemoryRouter><AuthPage mode="register" /></MemoryRouter>);
  fillRegistration('00.000.000/e08g-12');
  expect((screen.getByLabelText('CNPJ da empresa') as HTMLInputElement).value).toBe('00.000.000/E08G-12');
  await userEvent.click(screen.getByRole('button', { name: 'Continuar para pagamento' }));
  expect(auth.register).toHaveBeenCalledWith(expect.objectContaining({ document: '00.000.000/E08G-12', companyName: 'Loja Teste' }));
});

test('legacy accounts can regularize their business and the form submits canonical CNPJ', async () => {
  auth.user = { document: '52998224725', companyName: 'Loja antiga' };
  auth.updateBusiness.mockResolvedValue({});
  render(<MemoryRouter><BusinessProfile /></MemoryRouter>);
  fireEvent.change(screen.getByLabelText('CNPJ da empresa'), { target: { value: '04.252.011/0001-10' } });
  await userEvent.click(screen.getByRole('button', { name: 'Salvar e continuar' }));
  await waitFor(() => expect(auth.updateBusiness).toHaveBeenCalledWith({ document: '04252011000110', companyName: 'Loja antiga' }));
});
