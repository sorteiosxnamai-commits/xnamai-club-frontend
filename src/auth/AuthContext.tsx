import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';
import { AppRole } from './roles';

export type User = {
  id: string;
  email: string;
  name: string;
  companyName?: string;
  city?: string;
  state?: string;
  document?: string;
  role: AppRole;
};

type RegisterInput = {
  name: string;
  email: string;
  password: string;
  companyName?: string;
  city: string;
  state: string;
  document: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login(email: string, password: string): Promise<User>;
  register(input: RegisterInput): Promise<User>;
  logout(): void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('xnamai_token')) {
      setLoading(false);
      return;
    }
    api<User>('/auth/me').then(setUser).catch(() => localStorage.removeItem('xnamai_token')).finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const result = await api<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    localStorage.setItem('xnamai_token', result.token);
    setUser(result.user);
    return result.user;
  }

  async function register(input: RegisterInput) {
    const result = await api<{ token: string; user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(input) });
    localStorage.setItem('xnamai_token', result.token);
    setUser(result.user);
    return result.user;
  }

  function logout() {
    localStorage.removeItem('xnamai_token');
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthProvider ausente');
  return ctx;
}
