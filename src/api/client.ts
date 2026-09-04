function resolveApiUrl() {
  const raw = String(import.meta.env.VITE_API_URL || 'http://localhost:4000/api').trim().replace(/\/$/, '');
  if (raw.endsWith('/api')) return raw;
  return `${raw}/api`;
}

const API_URL = resolveApiUrl();

export type ApiErrorBody = {
  message?: string;
  issues?: { fieldErrors?: Record<string, string[] | undefined>; formErrors?: string[] };
};

export class ApiRequestError extends Error {
  fields: Record<string, string>;

  constructor(message: string, fields: Record<string, string> = {}) {
    super(message);
    this.name = 'ApiRequestError';
    this.fields = fields;
  }
}

function fieldErrorsFromBody(data: ApiErrorBody) {
  const fields: Record<string, string> = {};
  for (const [key, messages] of Object.entries(data.issues?.fieldErrors || {})) {
    if (messages?.[0]) fields[key] = messages[0];
  }
  return fields;
}

function messageFromBody(data: ApiErrorBody, fallback: string) {
  const fieldMessages = Object.values(fieldErrorsFromBody(data));
  return data.message || fieldMessages[0] || data.issues?.formErrors?.[0] || fallback;
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('xnamai_token');
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new ApiRequestError('Não foi possível conectar ao servidor. Tente novamente.');
  }

  const data = (await response.json().catch(() => ({}))) as ApiErrorBody;
  if (!response.ok) {
    throw new ApiRequestError(
      messageFromBody(data, 'Não foi possível concluir. Tente novamente.'),
      fieldErrorsFromBody(data),
    );
  }
  return data as T;
}

export const money = (cents: number | null | undefined) =>
  cents == null ? 'Fale conosco' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
