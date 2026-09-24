import { useEffect, useState } from 'react';
import { Check, Diamond } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, money } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { homePath } from '../auth/roles';
import { PublicHeader } from '../components/PublicHeader';
import { logAppEvent } from '../telemetry';

export type Plan = {
  id: string;
  code: string;
  name: string;
  monthlyPriceCents: number | null;
  compareAtPriceCents?: number | null;
  purchaseLimitCents: number | null;
  description: string;
};

type CurrentSubscription = {
  status?: string;
  plan?: { id?: string; code?: string } | null;
};

export function planBenefits(plan: Plan) {
  const benefits = ['Acesso ao XNaMai Club', 'Acesso aos preços do clube'];
  if (plan.code === 'PRIORITY') {
    benefits.push('Ofertas exclusivas', 'Atendimento prioritário', 'Condições especiais', 'Prioridade nos pedidos');
  }
  return benefits;
}

export function PlanPrice({ plan }: { plan: Plan }) {
  const hasLaunchDeal = plan.compareAtPriceCents != null && plan.monthlyPriceCents != null;
  return (
    <div className="price">
      {hasLaunchDeal && <span className="price-was">{money(plan.compareAtPriceCents)}</span>}
      <span className="price-now">
        {money(plan.monthlyPriceCents)}
        {plan.monthlyPriceCents != null && <small>/mês</small>}
      </span>
      {hasLaunchDeal && <span className="launch-save">de {money(plan.compareAtPriceCents)} por {money(plan.monthlyPriceCents)}</span>}
    </div>
  );
}

export function Plans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  useEffect(() => { api<Plan[]>('/plans').then(setPlans).catch(e => setError(e.message)); }, []);
  useEffect(() => {
    if (user?.role !== 'CUSTOMER') return;
    api<CurrentSubscription>('/subscriptions/me').then(setCurrentSubscription).catch(() => setCurrentSubscription(null));
  }, [user]);

  function choose(plan: Plan) {
    sessionStorage.setItem('selected_plan', JSON.stringify(plan));
    logAppEvent('Plano escolhido', { plan: plan.name || plan.code || 'lancamento' });
    if (user?.role === 'CUSTOMER') navigate('/checkout');
    else if (user) navigate(homePath(user.role));
    else navigate('/cadastro');
  }

  return <>
    <PublicHeader />
    <main className="public-page plans-page launch-plans">
      <div className="eyebrow">👑 PLANOS XNAMAI CLUB</div>
      <h1 className="center-title"><span>XNaMai</span> Club</h1>
      <p className="center-subtitle">Escolha entre o acesso Basic de lançamento e a prioridade nos pedidos.</p>
      {error && <div className="error-box" role="alert">{error}</div>}
      <div className="plans-grid">
        {plans.map((plan) => (
          <article className="plan-card featured" key={plan.id}>
            <div className="recommended">{plan.code === 'PRIORITY' ? '★ PRIORIDADE NOS PEDIDOS' : '★ LANÇAMENTO'}</div>
            <div className="plan-icon"><Diamond /></div>
            <h3>{plan.name}</h3>
            <PlanPrice plan={plan} />
            <div className="limit">{plan.description}</div>
            <ul>
              {planBenefits(plan).map((benefit) => <li key={benefit}><Check /> {benefit}</li>)}
            </ul>
            <button
              className="btn primary"
              disabled={currentSubscription?.status === 'ACTIVE' && currentSubscription.plan?.id === plan.id}
              onClick={() => choose(plan)}
            >
              {currentSubscription?.status === 'ACTIVE' && currentSubscription.plan?.id === plan.id
                ? 'Plano atual'
                : currentSubscription?.status === 'ACTIVE'
                  && currentSubscription.plan?.code === 'LAUNCH'
                  && plan.code === 'PRIORITY'
                    ? 'Fazer upgrade'
                    : 'Assinar plano'}
            </button>
          </article>
        ))}
      </div>
    </main>
  </>;
}
