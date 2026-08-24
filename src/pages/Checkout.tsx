import { useMemo, useState } from 'react';
import { CreditCard, QrCode, ShieldCheck } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { api, money } from '../api/client';
import { PublicHeader } from '../components/PublicHeader';
import { Plan } from './Plans';

function addCalendarMonth(from = new Date()) {
  const next = new Date(from);
  next.setMonth(next.getMonth() + 1);
  return next;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(date);
}

export function Checkout() {
  const plan = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem('selected_plan') || '') as Plan; }
    catch { return null; }
  }, []);
  const [method, setMethod] = useState<'CREDIT_CARD' | 'PIX_RECURRING'>('CREDIT_CARD');
  const [step, setStep] = useState<2 | 3>(2);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const nextCharge = addCalendarMonth();

  if (!plan) return <Navigate to="/planos" replace />;
  const selectedPlan = plan;

  async function finish() {
    if (method !== 'CREDIT_CARD') {
      setError('A recorrência nesta etapa é autorizada no cartão pela Stripe. PIX recorrente entra em seguida.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await api<{ url: string }>('/subscriptions/checkout', {
        method: 'POST',
        body: JSON.stringify({ planId: selectedPlan.id }),
      });
      window.location.href = result.url;
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <>
      <PublicHeader />
      <main className="checkout-page">
        <div className="steps">
          <span className="done">1 Planos ✓</span>
          <span className={step === 2 ? 'active' : ''}>2 Pré-aprovação</span>
          <span className={step === 3 ? 'active' : ''}>3 Pagamento</span>
          <span>4 Confirmação</span>
        </div>
        <h1>{step === 2 ? 'Pré-aprovação da assinatura' : 'Pagamento da assinatura'}</h1>
        <p>
          {step === 2
            ? 'Escolha como deseja pagar sua assinatura do XNaMai Club.'
            : `O cartão é tokenizado na Stripe. A cobrança recorrente fica no dia ${formatDate(new Date())} de cada mês — a próxima é ${formatDate(nextCharge)}.`}
        </p>
        <section className="checkout-grid">
          <aside className="panel plan-summary">
            <div className="diamond-mark">◇</div>
            <h2>{plan.name}</h2>
            <div className="checkout-price">{money(plan.monthlyPriceCents)}<small>/mês</small></div>
            <p>{plan.description}</p>
            <ul>
              <li>✓ Preços diferenciados</li>
              <li>✓ Acesso ao XNaMai Club</li>
              <li>✓ Ofertas exclusivas</li>
            </ul>
          </aside>
          <div className="panel checkout-main">
            {step === 2 ? (
              <>
                <h2>Escolha a forma de pagamento</h2>
                <button className={`payment-option ${method === 'CREDIT_CARD' ? 'selected' : ''}`} onClick={() => setMethod('CREDIT_CARD')}>
                  <CreditCard />
                  <span><b>Cartão de crédito</b><small>Autorização agora e recorrência mensal no mesmo dia.</small></span>
                </button>
                <button className={`payment-option ${method === 'PIX_RECURRING' ? 'selected' : ''}`} onClick={() => setMethod('PIX_RECURRING')}>
                  <QrCode />
                  <span><b>PIX recorrente</b><small>Em breve. Use o cartão para testar a Stripe.</small></span>
                </button>
                <div className="secure-note"><ShieldCheck /> A assinatura só ativa depois da autorização na Stripe.</div>
                <button className="btn primary large full" onClick={() => setStep(3)}>Continuar</button>
              </>
            ) : (
              <>
                <h2>Autorização segura</h2>
                <p className="security-copy">
                  Os dados do cartão não passam pelo XNaMai. A Stripe gera o PaymentMethod (token), autoriza a primeira cobrança
                  e agenda as próximas no mesmo dia do mês.
                </p>
                {error && <div className="error-box">{error}</div>}
                <div className="checkout-actions">
                  <button className="btn ghost" onClick={() => setStep(2)}>Voltar</button>
                  <button className="btn primary large" onClick={finish} disabled={busy}>
                    {busy ? 'Redirecionando...' : 'Autorizar na Stripe'}
                  </button>
                </div>
              </>
            )}
          </div>
          <aside className="panel order-summary">
            <h2>Resumo da assinatura</h2>
            <div><span>Plano</span><b>{plan.name}</b></div>
            <div><span>Mensalidade</span><b>{money(plan.monthlyPriceCents)}</b></div>
            <div><span>Forma</span><b>{method === 'CREDIT_CARD' ? 'Cartão' : 'PIX recorrente'}</b></div>
            <div><span>Próxima cobrança</span><b>{formatDate(nextCharge)}</b></div>
            <hr />
            <div className="total"><span>Total mensal</span><b>{money(plan.monthlyPriceCents)}</b></div>
            <div className="secure-note"><ShieldCheck /> Ambiente protegido</div>
          </aside>
        </section>
      </main>
    </>
  );
}
