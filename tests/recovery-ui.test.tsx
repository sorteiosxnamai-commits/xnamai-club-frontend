// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const { apiMock, clearTokenMock } = vi.hoisted(() => ({ apiMock: vi.fn(), clearTokenMock: vi.fn() }));
vi.mock('../src/api/client', () => ({
  api: apiMock,
  ApiRequestError: class ApiRequestError extends Error {},
}));
vi.mock('../src/components/PublicHeader', () => ({ PublicHeader: () => <header>Club</header> }));
vi.mock('../src/recovery-token', () => ({ getResetToken: () => 'a'.repeat(64), clearResetToken: clearTokenMock }));

import { ForgotPasswordPage, ResetPasswordPage } from '../src/pages/PasswordRecovery';

afterEach(() => { cleanup(); apiMock.mockReset(); clearTokenMock.mockReset(); });

test('forgot form shows loading and the same generic message after success', async () => {
  let complete!: (value: { message: string }) => void;
  apiMock.mockImplementation(() => new Promise((resolve) => { complete = resolve; }));
  const user = userEvent.setup();
  render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>);
  await user.type(screen.getByLabelText('E-mail'), 'cliente@example.com');
  await user.click(screen.getByRole('button', { name: 'Enviar link de recuperação' }));
  expect(screen.getByRole('button', { name: 'Enviando...' }).hasAttribute('disabled')).toBe(true);
  expect(apiMock).toHaveBeenCalledWith('/auth/forgot-password', expect.objectContaining({ method: 'POST', body: JSON.stringify({ email: 'cliente@example.com' }) }));
  complete({ message: 'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.' });
  expect(await screen.findByRole('status')).toHaveProperty('textContent', 'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.');
  expect(screen.getByRole('link', { name: 'Voltar ao login' }).getAttribute('href')).toBe('/login');
});

test('forgot form reports server failure', async () => {
  apiMock.mockRejectedValue(new Error('unavailable'));
  const user = userEvent.setup();
  render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>);
  await user.type(screen.getByLabelText('E-mail'), 'cliente@example.com');
  await user.click(screen.getByRole('button', { name: 'Enviar link de recuperação' }));
  expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Não foi possível solicitar o link. Tente novamente.');
});

test('reset form validates confirmation and submits without creating a session', async () => {
  apiMock.mockResolvedValue({ message: 'ok' });
  const user = userEvent.setup();
  render(<MemoryRouter><ResetPasswordPage /></MemoryRouter>);
  await user.type(screen.getByLabelText('Nova senha'), '12345678');
  await user.type(screen.getByLabelText('Confirmar senha'), 'different');
  await user.click(screen.getByRole('button', { name: 'Redefinir senha' }));
  expect(screen.getByRole('alert')).toHaveProperty('textContent', 'As senhas não coincidem.');
  expect(apiMock).not.toHaveBeenCalled();
  await user.clear(screen.getByLabelText('Confirmar senha'));
  await user.type(screen.getByLabelText('Confirmar senha'), '12345678');
  await user.click(screen.getByRole('button', { name: 'Redefinir senha' }));
  expect(apiMock).toHaveBeenCalledWith('/auth/reset-password', expect.objectContaining({ body: JSON.stringify({ token: 'a'.repeat(64), password: '12345678' }) }));
  expect(await screen.findByRole('status')).toHaveProperty('textContent', 'Senha redefinida com sucesso. Entre com a nova senha.');
  expect(clearTokenMock).toHaveBeenCalledOnce();
  expect(screen.getByRole('link', { name: 'Voltar ao login' }).getAttribute('href')).toBe('/login');
});

test('reset form offers another link after invalid token response', async () => {
  apiMock.mockRejectedValue(new Error('invalid'));
  const user = userEvent.setup();
  render(<MemoryRouter><ResetPasswordPage /></MemoryRouter>);
  await user.type(screen.getByLabelText('Nova senha'), '12345678');
  await user.type(screen.getByLabelText('Confirmar senha'), '12345678');
  await user.click(screen.getByRole('button', { name: 'Redefinir senha' }));
  expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Não foi possível redefinir a senha. Tente novamente.');
  expect(screen.getByRole('link', { name: 'Solicitar outro link' }).getAttribute('href')).toBe('/esqueci-senha');
});
