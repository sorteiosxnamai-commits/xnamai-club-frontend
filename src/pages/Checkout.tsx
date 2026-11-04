import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { isValidCnpj } from '../cnpj';
import { api, ApiRequestError, money } from '../api/client';
import { PublicHeader } from '../components/PublicHeader';
import { Plan, PlanPrice, planBenefits } from './Plans';
import { AsaasCheckout } from './AsaasCheckout';
import { logAppEvent } from '../telemetry';

type CurrentSubscription = { id: string; status: string; currentPeriodEnd?: string | null; cancelledAt?: string | null;
  gatewaySubscriptionId?: string | null; plan?: { code?: string; name?: string } | null };

export function Checkout() {
  const navigate = useNavigate();
  const [plan] = useState<Plan | null>(() => {
    try { return JSON.parse(sessionStorage.getItem('selected_plan') || '') as Plan; } catch { return null; }
  });
  const [subscription, setSubscription] = useState<CurrentSubscription | null | undefined>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [business, setBusiness] = useState<{ document?: string; companyName?: string } | null>(null);
  useEffect(() => {
    let active = true;
    Promise.all([
      api<CurrentSubscription>('/subscriptions/me').catch(error => {
        if (error instanceof ApiRequestError && error.status === 404) return null;
        throw error;
      }),
      api<{ document?: string; companyName?: string }>('/auth/me'),
    ]).then(([subscription, business]) => { if (active) { setSubscription(subscription); setBusiness(business); } }).catch(error => {
      if (!active) return;
      setError('Não foi possível verificar sua assinatura. Recarregue a página antes de continuar.');
    });
    return () => { active = false; };
  }, []);
  if (!plan) return <Navigate to="/planos" replace />;
  if (subscription === undefined) return <><PublicHeader /><main className="checkout-page">
    {error ? <div className="error-box" role="alert">{error}</div> : <p>Carregando assinatura atual...</p>}
  </main></>;
  if (!isValidCnpj(business?.document || '') || (business?.companyName?.trim().length || 0) < 2) return <><PublicHeader /><main className="checkout-page panel">
    <h1>Regularize o cadastro da empresa</h1><p>Os planos são exclusivos para lojistas com CNPJ. O período já pago continua disponível na sua conta.</p>
    <Link className="btn primary" to="/app/cadastro-empresa">Informar CNPJ da empresa</Link>
    <Link className="btn ghost" to="/app">Minha conta</Link>
  </main></>;
  const isUpgrade = subscription?.status === 'ACTIVE' && Boolean(subscription.gatewaySubscriptionId)
    && subscription.plan?.code === 'LAUNCH' && plan.code === 'PRIORITY';
  const covered = Boolean(subscription?.currentPeriodEnd && new Date(subscription.currentPeriodEnd).getTime() > Date.now());
  const inProgress = Boolean(subscription && (covered || subscription.status === 'PENDING'
    || (subscription.status === 'ACTIVE' && !subscription.currentPeriodEnd)
    || (subscription.gatewaySubscriptionId && subscription.status !== 'CANCELLED')));
  if (!isUpgrade) return <AsaasCheckout code={plan.code} hasSubscription={inProgress} />;

  async function upgrade() {
    if (busy || !plan) return;
    setBusy(true); setError('');
    try {
      await api('/subscriptions/upgrade', { method: 'POST', body: JSON.stringify({ planId: plan.id }) });
      sessionStorage.removeItem('selected_plan');
      logAppEvent('Upgrade Stripe', { to: plan.code });
      navigate('/app', { replace: true });
    } catch (error) { setError((error as Error).message); setBusy(false); }
  }
  return <><PublicHeader /><main className="checkout-page">
    <h1>Upgrade para o Plano Fast Pass</h1>
    <p>A assinatura atual será atualizada na Stripe, sem criar uma segunda assinatura.</p>
    <section className="checkout-grid">
      <aside className="panel plan-summary"><h2>{plan.name}</h2><PlanPrice plan={plan} />
        <ul>{planBenefits(plan).map(benefit => <li key={benefit}>{benefit}</li>)}</ul>
      </aside>
      <div className="panel checkout-main"><h2>Confirmar upgrade</h2>
        <p>A Stripe cobrará o ajuste proporcional e as próximas mensalidades serão de {money(plan.monthlyPriceCents)}. A forma de pagamento atual será mantida.</p>
        {subscription?.cancelledAt && <p>O cancelamento agendado será removido ao confirmar o upgrade.</p>}
        {error && <div className="error-box" role="alert">{error}</div>}
        <button className="btn primary" disabled={busy} onClick={upgrade}>{busy ? 'Atualizando…' : 'Confirmar upgrade'}</button>
      </div>
    </section>
  </main></>;
}
