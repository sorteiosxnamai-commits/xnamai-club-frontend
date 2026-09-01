export type AppRole = 'CUSTOMER' | 'ADMIN' | 'SUPPORT';

export function homePath(role: AppRole) {
  if (role === 'ADMIN') return '/admin';
  if (role === 'SUPPORT') return '/atendimento';
  return '/app';
}

export function isDeskRole(role?: AppRole | null) {
  return role === 'ADMIN' || role === 'SUPPORT';
}
