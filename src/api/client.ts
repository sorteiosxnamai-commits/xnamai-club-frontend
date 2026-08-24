function resolveApiUrl() {
  const raw = String(import.meta.env.VITE_API_URL || 'http://localhost:4000/api').trim().replace(/\/$/, '');
  if (raw.endsWith('/api')) return raw;
  return `${raw}/api`;
}

const API_URL = resolveApiUrl();

export type ApiError = { message: string };

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('xnamai_token');
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((data as ApiError).message || 'Falha na comunicação com a API.');
  return data as T;
}

export const money = (cents: number | null | undefined) =>
  cents == null ? 'Fale conosco' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
