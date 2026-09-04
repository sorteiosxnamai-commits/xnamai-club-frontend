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

function isValidCpf(digits: string) {
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false;
  const check = (length: number) => {
    const sum = digits.slice(0, length).split('').reduce((total, digit, index) => total + Number(digit) * (length + 1 - index), 0);
    const rest = (sum * 10) % 11;
    return (rest === 10 ? 0 : rest) === Number(digits[length]);
  };
  return check(9) && check(10);
}

function isValidCnpj(digits: string) {
  if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) return false;
  const check = (weights: number[]) => {
    const sum = weights.reduce((total, weight, index) => total + Number(digits[index]) * weight, 0);
    const rest = sum % 11;
    return (rest < 2 ? 0 : 11 - rest) === Number(digits[weights.length]);
  };
  return check([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) && check([6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
}

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
      const digits = form.document.replace(/\D/g, '');
      if (!isValidCpf(digits) && !isValidCnpj(digits)) nextFields.document = 'Informe um CPF ou CNPJ válido.';
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
                <input value={form.companyName} onChange={(e) => update('companyName', e.target.value)} autoComplete="organization" />
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
                CNPJ ou CPF
                <input
                  className={fieldErrors.document ? 'invalid' : ''}
                  value={form.document}
                  onChange={(e) => update('document', formatCpfCnpj(e.target.value))}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
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
