import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { isValidCnpj, formatCnpj, normalizeCnpj } from '../cnpj';
import { PublicHeader } from '../components/PublicHeader';

export function BusinessProfile() {
  const { user, updateBusiness } = useAuth();
  const navigate = useNavigate();
  const registered = isValidCnpj(user?.document || '');
  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [document, setDocument] = useState(registered ? formatCnpj(user!.document!) : '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!isValidCnpj(document)) { setError('Informe um CNPJ válido.'); return; }
    if (companyName.trim().length < 2) { setError('Informe o nome da empresa.'); return; }
    setError(''); setBusy(true);
    try {
      await updateBusiness({ companyName: companyName.trim(), document: normalizeCnpj(document) });
      navigate(sessionStorage.getItem('selected_plan') ? '/checkout' : '/app', { replace: true });
    } catch (error) { setError((error as Error).message); setBusy(false); }
  }
  return <><PublicHeader /><main className="auth-page"><form className="auth-card" onSubmit={save} noValidate>
    <h1>Cadastro da empresa</h1>
    <p>Os planos são exclusivos para lojistas com CNPJ. Regularize o cadastro para uma nova contratação. O acesso ao período já pago é preservado.</p>
    <label>Empresa<input required maxLength={200} value={companyName} onChange={event => setCompanyName(event.target.value)} autoComplete="organization" /></label>
    <label>CNPJ da empresa<input required maxLength={18} readOnly={registered} value={document} onChange={event => setDocument(formatCnpj(event.target.value))} placeholder="00.000.000/0000-00" autoComplete="off" /></label>
    {registered && <p>Para alterar o CNPJ, fale com o atendimento.</p>}
    {error && <div className="error-box" role="alert">{error}</div>}
    <button className="btn primary full" disabled={busy}>{busy ? 'Salvando…' : 'Salvar e continuar'}</button>
    <Link className="btn ghost full" to="/app">Voltar à minha conta</Link>
  </form></main></>;
}
