export type AppRole = 'CUSTOMER' | 'ADMIN' | 'SUPPORT';

export function homePath(role: AppRole) {
  if (role === 'ADMIN') return '/admin';
  if (role === 'SUPPORT') return '/atendimento';
  return '/app';
}

/** Papeis da mesa interna de atendimento (lista clientes com dados pessoais). */
export const ATENDIMENTO_ROLES: AppRole[] = ['ADMIN', 'SUPPORT'];

export function isDeskRole(role?: AppRole | null) {
  return !!role && ATENDIMENTO_ROLES.includes(role);
}

export type Access = { kind: 'login' } | { kind: 'redirect'; to: string } | { kind: 'allow' };

/** Decisao unica de acesso usada pelo <Protected>: sem usuario -> login; papel fora da lista -> home do papel. */
export function accessFor(user: { role: AppRole } | null | undefined, allowed?: AppRole[]): Access {
  if (!user) return { kind: 'login' };
  if (allowed && !allowed.includes(user.role)) return { kind: 'redirect', to: homePath(user.role) };
  return { kind: 'allow' };
}
