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
  if (plan.code === 'PRIORITY') return [
    'Tudo do Plano Basic',
    'Fast Pass: pedido no mesmo dia',
    'Antecedência mínima de 6 horas',
    'Prioridade na separação do pedido',
    'XNaMai Lab — exclusivo para os 50 membros',
  ];
  return [
    'Preços exclusivos do Club',
    'Compre sem precisar fechar caixa',
    'Pedido com antecedência mínima de 24 horas',
  ];
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
      <p className="center-subtitle">Basic para comprar melhor. Prioridade para pedir mais rápido.</p>
      {error && <div className="error-box" role="alert">{error}</div>}
      <div className="plans-grid">
        {plans.map((plan) => {
          const priority = plan.code === 'PRIORITY';
          const current = currentSubscription?.status === 'ACTIVE' && currentSubscription.plan?.id === plan.id;
          const upgrade = currentSubscription?.status === 'ACTIVE'
            && currentSubscription.plan?.code === 'LAUNCH'
            && priority;
          const included = currentSubscription?.status === 'ACTIVE'
            && currentSubscription.plan?.code === 'PRIORITY'
            && plan.code === 'LAUNCH';
          return (
          <article className={`plan-card featured${priority ? ' priority-plan' : ' basic-plan'}`} key={plan.id}>
            <div className="recommended">{priority ? '⚡ FAST PASS — APENAS 50 VAGAS' : 'PLANO BASIC'}</div>
            <div className="plan-icon"><Diamond /></div>
            <h3>{plan.name}</h3>
            <PlanPrice plan={plan} />
            <div className="plan-promise">
              <strong>{priority ? 'O Fast Pass da XNaMai' : 'Acesso aos preços exclusivos do XNaMai Club'}</strong>
              {priority && (
                <p>Faça seu pedido com antecedência mínima de 6 horas para separação e envio no mesmo dia, dentro do nosso horário de operação.</p>
              )}
            </div>
            <div className={`plan-speed${priority ? ' fast' : ''}`}>
              <span>{priority ? 'PRIORIDADE' : 'BASIC'}</span>
              <strong>{priority ? '6H' : '24H'}</strong>
              <small>antecedência mínima</small>
            </div>
            <ul>
              {planBenefits(plan).map((benefit) => <li key={benefit}><Check /> {benefit}</li>)}
            </ul>
            {priority && (
              <>
                <div className="plan-capacity">
                  <strong>🔒 APENAS 50 CLIENTES</strong>
                  <p>O Plano Prioridade é limitado a 50 clientes para garantir que a prioridade realmente funcione.</p>
                </div>
                <div className="plan-lab">
                  <strong>🔬 XNaMai Lab</strong>
                  <p><b>Grupo exclusivo para até 50 membros.</b> Receba catálogos de novos produtos e participe da escolha dos produtos que poderão entrar no site da XNaMai conforme a demanda.</p>
                </div>
              </>
            )}
            <button
              className="btn primary"
              disabled={current || included}
              onClick={() => choose(plan)}
            >
              {current ? 'PLANO ATUAL' : included ? 'INCLUSO NO PLANO ATUAL' : upgrade ? 'FAZER UPGRADE' : priority ? 'QUERO O PRIORIDADE' : 'ASSINAR BASIC'}
            </button>
          </article>
          );
        })}
      </div>
    </main>
  </>;
}
