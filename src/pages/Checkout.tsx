import { useMemo, useState } from 'react';
import { CreditCard, QrCode, ShieldCheck } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { api, money } from '../api/client';
import { PublicHeader } from '../components/PublicHeader';
import { logAppEvent } from '../telemetry';
import { Plan, PlanPrice } from './Plans';

type PaymentMethodChoice = 'CREDIT_CARD' | 'PIX_RECURRING';

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
  const [method, setMethod] = useState<PaymentMethodChoice>('CREDIT_CARD');
  const [step, setStep] = useState<2 | 3>(2);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const nextCharge = addCalendarMonth();
  const isPix = method === 'PIX_RECURRING';

  if (!plan) return <Navigate to="/planos" replace />;
  const selectedPlan = plan;

  async function finish() {
    if (busy) return;
    if (!selectedPlan.id) {
      setError('Plano inválido. Volte em Planos e escolha novamente.');
      return;
    }
    setBusy(true);
    setError('');
    sessionStorage.setItem('checkout_method', method);
    try {
      const result = await api<{ url: string }>('/subscriptions/checkout', {
        method: 'POST',
        body: JSON.stringify({ planId: selectedPlan.id, paymentMethodType: method }),
      });
      logAppEvent('Checkout Stripe', { method });
      window.location.href = result.url;
    } catch (e) {
      const message = (e as Error).message;
      setError(message);
      logAppEvent('Checkout falhou', { reason: message.slice(0, 180), method });
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
        <h1>{step === 2 ? 'Pré-aprovação da assinatura' : isPix ? 'Pagamento via PIX' : 'Pagamento da assinatura'}</h1>
        <p>
          {step === 2
            ? 'Escolha como deseja pagar sua assinatura do XNaMai Club.'
            : isPix
              ? `A Stripe exibe o QR Code ou o código PIX. Depois de autorizar o Pix Automático no banco, a cobrança mensal fica no dia ${formatDate(new Date())} — a próxima é ${formatDate(nextCharge)}.`
              : `O cartão é tokenizado na Stripe. A cobrança recorrente fica no dia ${formatDate(new Date())} de cada mês — a próxima é ${formatDate(nextCharge)}.`}
        </p>
        <section className="checkout-grid">
          <aside className="panel plan-summary">
            <div className="diamond-mark">◇</div>
            <h2>{plan.name}</h2>
            <div className="checkout-price"><PlanPrice plan={plan} /></div>
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
                <button type="button" className={`payment-option ${method === 'CREDIT_CARD' ? 'selected' : ''}`} onClick={() => setMethod('CREDIT_CARD')}>
                  <CreditCard />
                  <span><b>Cartão de crédito</b><small>Autorização agora e recorrência mensal no mesmo dia.</small></span>
                </button>
                <button type="button" className={`payment-option ${isPix ? 'selected' : ''}`} onClick={() => setMethod('PIX_RECURRING')}>
                  <QrCode />
                  <span><b>PIX recorrente</b><small>QR Code ou copia e cola na Stripe, com mandato Pix Automático para as próximas mensalidades.</small></span>
                </button>
                <div className="secure-note"><ShieldCheck /> A assinatura só ativa depois da autorização na Stripe.</div>
                <button type="button" className="btn primary large full" onClick={() => { setError(''); setStep(3); }}>Continuar</button>
              </>
            ) : (
              <>
                <h2>{isPix ? 'PIX na Stripe' : 'Autorização segura'}</h2>
                {isPix ? (
                  <>
                    <div className="pix-box">
                      <QrCode size={56} />
                      <p>O QR Code e o código copia e cola aparecem na página da Stripe, não nesta tela.</p>
                    </div>
                    <p className="security-copy">
                      Você autoriza o Pix Automático no app do banco. A Stripe guarda o mandato da recorrência.
                      Dados bancários não passam pelo XNaMai.
                    </p>
                  </>
                ) : (
                  <p className="security-copy">
                    Os dados do cartão não passam pelo XNaMai. A Stripe gera o PaymentMethod (token), autoriza a primeira cobrança
                    e agenda as próximas no mesmo dia do mês.
                  </p>
                )}
                {error && <div className="error-box" role="alert">{error}</div>}
                <div className="checkout-actions">
                  <button type="button" className="btn ghost" onClick={() => setStep(2)}>Voltar</button>
                  <button type="button" className="btn primary large" onClick={finish} disabled={busy}>
                    {busy ? 'Redirecionando...' : isPix ? 'Pagar com PIX na Stripe' : 'Autorizar na Stripe'}
                  </button>
                </div>
              </>
            )}
          </div>
          <aside className="panel order-summary">
            <h2>Resumo da assinatura</h2>
            <div><span>Plano</span><b>{plan.name}</b></div>
            {plan.compareAtPriceCents != null && (
              <div><span>De</span><b className="price-was">{money(plan.compareAtPriceCents)}</b></div>
            )}
            <div><span>Mensalidade</span><b>{money(plan.monthlyPriceCents)}</b></div>
            <div><span>Forma</span><b>{isPix ? 'PIX recorrente' : 'Cartão'}</b></div>
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
