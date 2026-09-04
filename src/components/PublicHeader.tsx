import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Brand } from './Brand';
import { useAuth } from '../auth/AuthContext';

export function PublicHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="topbar">
      <Link to="/"><Brand /></Link>
      <nav className="nav-links">
        <NavLink to="/">Início</NavLink>
        <NavLink to="/planos">Planos</NavLink>
        <NavLink to="/regras">Regras</NavLink>
        <NavLink to="/simulador">Simulador</NavLink>
        <a href="https://xnamai.meuspedidos.com.br/" target="_blank" rel="noopener noreferrer">Catálogo</a>
        {user?.role === 'CUSTOMER' && <NavLink to="/app">Minha conta</NavLink>}
        {user?.role === 'ADMIN' && <NavLink to="/admin">Admin</NavLink>}
      </nav>
      <div className="header-actions">
        {!user ? (
          <>
            <button className="btn ghost" onClick={() => navigate('/login')}>Entrar</button>
            <Link className="btn primary" to="/planos">Quero assinar</Link>
          </>
        ) : (
          <button className="account-chip" onClick={() => { logout(); navigate('/'); }}>
            <span className="avatar">{user.name.slice(0, 2).toUpperCase()}</span>
            <span><strong>{user.companyName || user.name}</strong><small>Sair</small></span>
          </button>
        )}
      </div>
    </header>
  );
}
