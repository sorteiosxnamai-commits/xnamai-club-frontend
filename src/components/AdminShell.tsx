import { LayoutDashboard, LogOut, ReceiptText, Repeat, ScrollText, Users } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Brand } from './Brand';
import { useAuth } from '../auth/AuthContext';

function AdminNav() {
  return (
    <>
      <NavLink to="/admin" end><LayoutDashboard />Dashboard</NavLink>
      <NavLink to="/admin/assinaturas"><Repeat />Assinaturas</NavLink>
      <NavLink to="/admin/cobrancas"><ReceiptText />Cobranças</NavLink>
      <NavLink to="/admin/clientes"><Users />Clientes</NavLink>
      <NavLink to="/admin/logs"><ScrollText />Logs Vercel</NavLink>
    </>
  );
}

export function AdminShell() {
  const { logout } = useAuth();
  const nav = useNavigate();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Brand admin />
        <nav><AdminNav /></nav>
        <button className="btn ghost full" onClick={() => { logout(); nav('/'); }}>
          <LogOut />Sair
        </button>
      </aside>
      <main className="admin-main">
        <nav className="admin-mobile-nav"><AdminNav /></nav>
        <Outlet />
      </main>
    </div>
  );
}

export function AdminHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="admin-header">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <span className="admin-chip">Admin XNaMai</span>
    </header>
  );
}
