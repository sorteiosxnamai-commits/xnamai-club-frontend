import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiRequestError } from '../api/client';
import { PublicHeader } from '../components/PublicHeader';
import { clearResetToken, getResetToken } from '../recovery-token';
import { validateResetPassword } from './recovery-form';

const FORGOT_MESSAGE = 'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      await api<{ message: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: email.trim() }) });
      setMessage(FORGOT_MESSAGE);
    } catch (cause) {
      setError(cause instanceof ApiRequestError ? cause.message : 'Não foi possível solicitar o link. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  return <>
    <PublicHeader />
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <div className="eyebrow">XNAMAI CLUB</div>
        <h1>Esqueci minha senha</h1>
        {message ? <div className="success-box" role="status">{message}</div> : <>
          <p className="field-hint">Informe seu e-mail para receber um link de recuperação.</p>
          {error && <div className="error-box" role="alert">{error}</div>}
          <label>E-mail<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <button className="btn primary large full" type="submit" disabled={busy}>{busy ? 'Enviando...' : 'Enviar link de recuperação'}</button>
        </>}
        <p className="auth-switch"><Link to="/login">Voltar ao login</Link></p>
      </form>
    </main>
  </>;
}

export function ResetPasswordPage() {
  const [token] = useState(getResetToken);
  useEffect(() => () => clearResetToken(), []);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const validation = validateResetPassword(password, confirmation);
    if (validation) { setError(validation); return; }
    setBusy(true);
    setError('');
    try {
      await api<{ message: string }>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) });
      setSuccess(true);
      clearResetToken();
      setPassword('');
      setConfirmation('');
    } catch (cause) {
      setError(cause instanceof ApiRequestError ? cause.message : 'Não foi possível redefinir a senha. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  return <>
    <PublicHeader />
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit} noValidate>
        <div className="eyebrow">XNAMAI CLUB</div>
        <h1>Redefinir senha</h1>
        {success ? <div className="success-box" role="status">Senha redefinida com sucesso. Entre com a nova senha.</div> : !token ? <>
          <div className="error-box" role="alert">Link inválido ou expirado. Solicite outro link de recuperação.</div>
          <p className="auth-switch"><Link to="/esqueci-senha">Solicitar outro link</Link></p>
        </> : <>
          {error && <div className="error-box" role="alert">{error}</div>}
          <label>Nova senha<input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          <label>Confirmar senha<input type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>
          <button className="btn primary large full" type="submit" disabled={busy}>{busy ? 'Redefinindo...' : 'Redefinir senha'}</button>
          <p className="auth-switch"><Link to="/esqueci-senha">Solicitar outro link</Link></p>
        </>}
        <p className="auth-switch"><Link to="/login">Voltar ao login</Link></p>
      </form>
    </main>
  </>;
}
