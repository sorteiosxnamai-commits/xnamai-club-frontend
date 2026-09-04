import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Brand } from './Brand';
import { useAuth } from '../auth/AuthContext';

export function PublicHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    const onResize = () => {
      if (window.matchMedia('(min-width: 1081px)').matches) setMenuOpen(false);
    };
    document.body.classList.add('nav-locked');
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      document.body.classList.remove('nav-locked');
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [menuOpen]);

  function go(path: string) {
    setMenuOpen(false);
    navigate(path);
  }

  return (
    <header className={`topbar${menuOpen ? ' menu-open' : ''}`}>
      <Link to="/" className="brand-link" onClick={() => setMenuOpen(false)}>
        <Brand />
      </Link>
      <nav className="nav-links" id="site-nav">
        <NavLink to="/">Início</NavLink>
        <NavLink to="/planos">Planos</NavLink>
        <NavLink to="/regras">Regras</NavLink>
        <NavLink to="/simulador">Simulador</NavLink>
        <a href="https://xnamai.meuspedidos.com.br/" target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)}>Catálogo</a>
        {user?.role === 'CUSTOMER' && <NavLink to="/app">Minha conta</NavLink>}
        {user?.role === 'ADMIN' && <NavLink to="/admin">Admin</NavLink>}
        <div className="nav-drawer-actions">
          {!user ? (
            <>
              <button className="btn ghost full" type="button" onClick={() => go('/login')}>Entrar</button>
              <Link className="btn primary full" to="/planos" onClick={() => setMenuOpen(false)}>Quero assinar</Link>
            </>
          ) : (
            <button
              className="btn ghost full"
              type="button"
              onClick={() => {
                logout();
                go('/');
              }}
            >
              Sair
            </button>
          )}
        </div>
      </nav>
      <div className="header-actions">
        {!user ? (
          <>
            <button className="btn ghost" type="button" onClick={() => navigate('/login')}>Entrar</button>
            <Link className="btn primary" to="/planos">Quero assinar</Link>
          </>
        ) : (
          <button
            className="account-chip"
            type="button"
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            <span className="avatar">{user.name.slice(0, 2).toUpperCase()}</span>
            <span>
              <strong>{user.companyName || user.name}</strong>
              <small>Sair</small>
            </span>
          </button>
        )}
      </div>
      <button
        className="menu-toggle"
        type="button"
        aria-expanded={menuOpen}
        aria-controls="site-nav"
        aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
      {menuOpen && (
        <button
          className="nav-scrim"
          type="button"
          aria-label="Fechar menu"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </header>
  );
}
