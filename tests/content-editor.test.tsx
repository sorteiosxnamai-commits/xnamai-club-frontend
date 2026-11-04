// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }));
vi.mock('../src/api/client', async original => ({ ...await original<typeof import('../src/api/client')>(), api: apiMock }));
vi.mock('../src/components/AdminShell', () => ({ AdminHeader: () => <h1>Editor</h1> }));
vi.mock('../src/components/PublicHeader', () => ({ PublicHeader: () => <header>Club</header> }));
import { AdminContent } from '../src/pages/AdminContent';
import { Home } from '../src/pages/Home';
import { ContentProvider } from '../src/content/ContentContext';
afterEach(() => { cleanup(); apiMock.mockReset(); vi.restoreAllMocks(); });

test('publishing an edited page updates the public screen and never interprets HTML', async () => {
  apiMock.mockImplementation(async (path: string, options?: RequestInit) => {
    if (options?.method === 'PUT') return { screen: 'home', revision: 1, values: JSON.parse(options.body as string).values };
    if (path === '/content') return {};
    return [];
  });
  render(<MemoryRouter><ContentProvider><AdminContent /><Home /></ContentProvider></MemoryRouter>);
  const field = await screen.findByLabelText('Destaque do título');
  await userEvent.clear(field);
  await userEvent.type(field, 'Novidade <b>lojistas</b>');
  expect(screen.getByRole('button', { name: 'Publicar alterações' }).hasAttribute('disabled')).toBe(false);
  expect(screen.queryByText('Novidade <b>lojistas</b>', { selector: 'span' })).toBeNull();
  await userEvent.click(screen.getByRole('button', { name: 'Publicar alterações' }));
  expect(await screen.findByRole('status')).toHaveProperty('textContent', 'Conteúdo publicado. A página pública já recebe esta versão.');
  expect(screen.getByText('Novidade <b>lojistas</b>', { selector: 'span' }).querySelector('b')).toBeNull();
  expect(apiMock).toHaveBeenCalledWith('/admin/content/home', expect.objectContaining({ method: 'PUT', body: JSON.stringify({ revision: 0, values: { title: 'Novidade <b>lojistas</b>' } }) }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Publicar alterações' }).hasAttribute('disabled')).toBe(true));
});

test('a conflicting publication preserves the draft and offers reload', async () => {
  apiMock.mockImplementation(async (_path: string, options?: RequestInit) => {
    if (options?.method === 'PUT') throw Object.assign(new Error('Outra publicação foi encontrada.'), { status: 409 });
    return [];
  });
  render(<MemoryRouter><AdminContent /></MemoryRouter>);
  const field = await screen.findByLabelText('Destaque do título');
  await userEvent.clear(field); await userEvent.type(field, 'Meu rascunho');
  await userEvent.click(screen.getByRole('button', { name: 'Publicar alterações' }));
  expect(await screen.findByRole('alert')).toBeTruthy();
  expect((field as HTMLTextAreaElement).value).toBe('Meu rascunho');
  expect(screen.getByRole('button', { name: 'Recarregar versão publicada' })).toBeTruthy();
});

test('restoring defaults stays in the draft until publication', async () => {
  apiMock.mockImplementation(async (path: string) => path.endsWith('/history') ? [] : [{ screen: 'home', revision: 2, values: { title: 'Título anterior' } }]);
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  render(<MemoryRouter><AdminContent /></MemoryRouter>);
  expect((await screen.findByLabelText('Destaque do título') as HTMLTextAreaElement).value).toBe('Título anterior');
  await userEvent.click(screen.getByRole('button', { name: 'Restaurar padrão' }));
  expect((screen.getByLabelText('Destaque do título') as HTMLTextAreaElement).value).toBe('Cresça com o XNaMai Club.');
  expect(apiMock.mock.calls.some(([, options]) => options?.method === 'PUT')).toBe(false);
});
