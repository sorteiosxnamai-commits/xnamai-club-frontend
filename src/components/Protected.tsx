import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AppRole, homePath } from '../auth/roles';

export function Protected({ children, role, roles }: { children: ReactNode; role?: AppRole; roles?: AppRole[] }) {
  const { user, loading } = useAuth();
  const allowed = roles ?? (role ? [role] : undefined);
  if (loading) return <div className="center-screen">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowed && !allowed.includes(user.role)) return <Navigate to={homePath(user.role)} replace />;
  return <>{children}</>;
}
