// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }));
vi.mock('../src/api/client', async original => ({ ...await original<typeof import('../src/api/client')>(), api: apiMock }));
vi.mock('../src/components/VercelTelemetry', () => ({ VercelTelemetry: () => null }));
import App from '../src/App';

afterEach(() => { cleanup(); localStorage.clear(); apiMock.mockReset(); });

for (const path of ['/atendimento', '/atendimentos']) {
  test(`${path} opens the atendimento desk instead of an empty page`, async () => {
    window.history.replaceState({}, '', path);
    apiMock.mockImplementation(async (route: string) => route === '/atendimento/members'
      ? { joined: [], unsigned: [] } : {});
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Atendimento', exact: true })).toBeTruthy();
    await waitFor(() => expect(window.location.pathname).toBe('/atendimento'));
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith('/atendimento/members'));
    expect(await screen.findByText('Nenhum cliente aderiu ao clube ainda.')).toBeTruthy();
  });
}
