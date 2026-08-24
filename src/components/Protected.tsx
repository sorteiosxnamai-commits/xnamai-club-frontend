import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function Protected({ children, role }: { children: ReactNode; role?: 'CUSTOMER' | 'ADMIN' }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-screen">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/app'} replace />;
  return <>{children}</>;
}
