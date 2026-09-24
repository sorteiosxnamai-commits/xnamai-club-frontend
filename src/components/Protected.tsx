import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AppRole, accessFor } from '../auth/roles';

export function Protected({ children, role, roles }: { children: ReactNode; role?: AppRole; roles?: AppRole[] }) {
  const { user, loading } = useAuth();
  const allowed = roles ?? (role ? [role] : undefined);
  if (loading) return <div className="center-screen">Carregando...</div>;
  const access = accessFor(user, allowed);
  if (access.kind === 'login') return <Navigate to="/login" replace />;
  if (access.kind === 'redirect') return <Navigate to={access.to} replace />;
  return <>{children}</>;
}
