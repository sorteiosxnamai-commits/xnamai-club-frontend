import { isValidCnpj, formatCnpj } from '../cnpj';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { PublicHeader } from '../components/PublicHeader';
import { useAuth } from '../auth/AuthContext';
import { homePath } from '../auth/roles';
import { ApiRequestError } from '../api/client';
import { logAppEvent } from '../telemetry';

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

type FormFields = {
  name: string;
  companyName: string;
  city: string;
  state: string;
  document: string;
  email: string;
  password: string;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="field-error">{message}</span>;
}

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { login, register, user, loading } = useAuth();
  const navigate = useNavigate();
  const errorRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormFields, string>>>({});
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<FormFields>({
    name: '',
    companyName: '',
    city: '',
    state: '',
    document: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [error]);

  function update<K extends keyof FormFields>(key: K, value: FormFields[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
    if (error) setError('');
  }

  if (!loading && user) {
    if (user.role === 'CUSTOMER' && sessionStorage.getItem('selected_plan')) return <Navigate to="/checkout" replace />;
    return <Navigate to={homePath(user.role)} replace />;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError('');
    const nextFields: Partial<Record<keyof FormFields, string>> = {};

    if (mode === 'register') {
      if (form.name.trim().length < 2) nextFields.name = 'Informe seu nome completo.';
      if (form.city.trim().length < 2) nextFields.city = 'Informe a cidade.';
      if (!form.state) nextFields.state = 'Informe um estado válido.';
      if (!isValidCnpj(form.document)) nextFields.document = 'Informe um CNPJ válido. O Club é exclusivo para lojistas.';
      if (form.companyName.trim().length < 2) nextFields.companyName = 'Informe o nome da empresa.';
    }
    if (!form.email.trim()) nextFields.email = 'Informe um e-mail válido.';
    if (mode === 'register' && form.password.length < 8) nextFields.password = 'A senha deve ter pelo menos 8 caracteres.';
    if (mode === 'login' && !form.password) nextFields.password = 'Informe a senha.';

    if (Object.keys(nextFields).length) {
      const reason = Object.values(nextFields)[0] || 'Confira os campos destacados e tente novamente.';
      setFieldErrors(nextFields);
      setError(reason);
      logAppEvent(mode === 'login' ? 'Login recusado' : 'Cadastro recusado', { reason: reason.slice(0, 180) });
      return;
    }

    setFieldErrors({});
    setBusy(true);
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
      logAppEvent(mode === 'login' ? 'Login concluido' : 'Cadastro concluido', { role: signedIn.role });
      if (signedIn.role === 'CUSTOMER' && sessionStorage.getItem('selected_plan')) navigate('/checkout');
      else navigate(homePath(signedIn.role));
    } catch (err) {
      const requestError = err instanceof ApiRequestError ? err : new ApiRequestError((err as Error).message);
      setFieldErrors(requestError.fields);
      setError(requestError.message || 'Não foi possível concluir. Tente novamente.');
      logAppEvent(mode === 'login' ? 'Login falhou' : 'Cadastro falhou', {
        reason: (requestError.message || 'erro').slice(0, 180),
      });
      setBusy(false);
    }
  }

  return (
    <>
      <PublicHeader />
      <main className="auth-page">
        <form className="auth-card" onSubmit={submit} noValidate>
          <div className="eyebrow">XNAMAI CLUB</div>
          <h1>{mode === 'login' ? 'Entrar na sua conta' : 'Crie sua conta'}</h1>
          {mode === 'register' && <p>Cadastro exclusivo para lojistas com CNPJ. Informe o nome da empresa e um CNPJ válido.</p>}
          {error && (
            <div className="error-box" role="alert" aria-live="assertive" ref={errorRef}>
              {error}
            </div>
          )}
          {mode === 'register' && (
            <>
              <label>
                Nome
                <input
                  className={fieldErrors.name ? 'invalid' : ''}
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  autoComplete="name"
                  required
                />
                <FieldError message={fieldErrors.name} />
              </label>
              <label>
                Empresa
                <input value={form.companyName} onChange={(e) => update('companyName', e.target.value)} autoComplete="organization" required maxLength={200} />
                <FieldError message={fieldErrors.companyName} />
              </label>
              <div className="two-cols">
                <label>
                  Cidade
                  <input
                    className={fieldErrors.city ? 'invalid' : ''}
                    value={form.city}
                    onChange={(e) => update('city', e.target.value)}
                    autoComplete="address-level2"
                    required
                  />
                  <FieldError message={fieldErrors.city} />
                </label>
                <label>
                  Estado
                  <select
                    className={fieldErrors.state ? 'invalid' : ''}
                    value={form.state}
                    onChange={(e) => update('state', e.target.value)}
                    required
                  >
                    <option value="">UF</option>
                    {BRAZIL_STATES.map((item) => (
                      <option key={item.uf} value={item.uf}>{item.uf} — {item.name}</option>
                    ))}
                  </select>
                  <FieldError message={fieldErrors.state} />
                </label>
              </div>
              <label>
                CNPJ da empresa
                <input
                  className={fieldErrors.document ? 'invalid' : ''}
                  value={form.document}
                  onChange={(e) => update('document', formatCnpj(e.target.value))}
                  inputMode="text"
                  autoComplete="off"
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  required
                />
                <FieldError message={fieldErrors.document} />
              </label>
            </>
          )}
          <label>
            E-mail
            <input
              className={fieldErrors.email ? 'invalid' : ''}
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              autoComplete="email"
              required
            />
            <FieldError message={fieldErrors.email} />
          </label>
          <label>
            Senha
            <input
              className={fieldErrors.password ? 'invalid' : ''}
              type="password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              minLength={8}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
            {mode === 'register' && !fieldErrors.password && <span className="field-hint">Mínimo de 8 caracteres.</span>}
            <FieldError message={fieldErrors.password} />
          </label>
          {mode === 'login' && <p className="auth-recovery"><Link to="/esqueci-senha">Esqueci minha senha</Link></p>}
          <button className="btn primary large full" type="submit" disabled={busy}>
            {busy
              ? (mode === 'login' ? 'Entrando...' : 'Criando conta...')
              : (mode === 'login' ? 'Entrar' : 'Continuar para pagamento')}
          </button>
          <p className="auth-switch">
            {mode === 'login'
              ? <>Não possui conta? <Link to="/cadastro">Cadastre-se</Link></>
              : <>Já possui conta? <Link to="/login">Entrar</Link></>}
          </p>
        </form>
      </main>
    </>
  );
}
