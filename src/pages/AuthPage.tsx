import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { PublicHeader } from '../components/PublicHeader';
import { useAuth } from '../auth/AuthContext';
import { homePath } from '../auth/roles';

const BRAZIL_STATES = [
  { uf: 'AC', name: 'Acre' }, { uf: 'AL', name: 'Alagoas' }, { uf: 'AP', name: 'Amapá' },
  { uf: 'AM', name: 'Amazonas' }, { uf: 'BA', name: 'Bahia' }, { uf: 'CE', name: 'Ceará' },
  { uf: 'DF', name: 'Distrito Federal' }, { uf: 'ES', name: 'Espírito Santo' }, { uf: 'GO', name: 'Goiás' },
  { uf: 'MA', name: 'Maranhão' }, { uf: 'MT', name: 'Mato Grosso' }, { uf: 'MS', name: 'Mato Grosso do Sul' },
  { uf: 'MG', name: 'Minas Gerais' }, { uf: 'PA', name: 'Pará' }, { uf: 'PB', name: 'Paraíba' },
  { uf: 'PR', name: 'Paraná' }, { uf: 'PE', name: 'Pernambuco' }, { uf: 'PI', name: 'Piauí' },
  { uf: 'RJ', name: 'Rio de Janeiro' }, { uf: 'RN', name: 'Rio Grande do Norte' }, { uf: 'RS', name: 'Rio Grande do Sul' },
  { uf: 'RO', name: 'Rondônia' }, { uf: 'RR', name: 'Roraima' }, { uf: 'SC', name: 'Santa Catarina' },
  { uf: 'SP', name: 'São Paulo' }, { uf: 'SE', name: 'Sergipe' }, { uf: 'TO', name: 'Tocantins' },
];

function formatCpfCnpj(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { login, register, user, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    companyName: '',
    city: '',
    state: '',
    document: '',
    email: '',
    password: '',
  });

  if (!loading && user) {
    if (user.role === 'CUSTOMER' && sessionStorage.getItem('selected_plan')) return <Navigate to="/checkout" replace />;
    return <Navigate to={homePath(user.role)} replace />;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const signedIn = mode === 'login'
        ? await login(form.email, form.password)
        : await register({
            name: form.name,
            companyName: form.companyName,
            city: form.city,
            state: form.state,
            document: form.document,
            email: form.email,
            password: form.password,
          });
      if (signedIn.role === 'CUSTOMER' && sessionStorage.getItem('selected_plan')) navigate('/checkout');
      else navigate(homePath(signedIn.role));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <>
      <PublicHeader />
      <main className="auth-page">
        <form className="auth-card" onSubmit={submit}>
          <div className="eyebrow">XNAMAI CLUB</div>
          <h1>{mode === 'login' ? 'Entrar na sua conta' : 'Crie sua conta'}</h1>
          {mode === 'register' && (
            <>
              <label>Nome<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
              <label>Empresa<input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></label>
              <div className="two-cols">
                <label>Cidade<input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required /></label>
                <label>
                  Estado
                  <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required>
                    <option value="">UF</option>
                    {BRAZIL_STATES.map((item) => (
                      <option key={item.uf} value={item.uf}>{item.uf} — {item.name}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                CNPJ ou CPF
                <input
                  value={form.document}
                  onChange={(e) => setForm({ ...form, document: formatCpfCnpj(e.target.value) })}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  required
                />
              </label>
            </>
          )}
          <label>E-mail<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
          <label>Senha<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} required /></label>
          {error && <div className="error-box">{error}</div>}
          <button className="btn primary large full">{mode === 'login' ? 'Entrar' : 'Continuar para pagamento'}</button>
          <p className="auth-switch">
            {mode === 'login'
              ? <>Não possui conta? <Link to="/cadastro">Cadastre-se</Link></>
              : <>Já possui conta? <Link to="/login">Entrar</Link></>}
          </p>
          {mode === 'login' && <p className="demo-note">Entre com o e-mail e a senha do administrador configurados no servidor.</p>}
        </form>
      </main>
    </>
  );
}
