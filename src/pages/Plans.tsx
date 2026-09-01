import { useEffect, useState } from 'react';
import { Check, Diamond } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, money } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { homePath } from '../auth/roles';
import { PublicHeader } from '../components/PublicHeader';

export type Plan = {
  id: string;
  code: string;
  name: string;
  monthlyPriceCents: number | null;
  compareAtPriceCents?: number | null;
  purchaseLimitCents: number | null;
  description: string;
};

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
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  useEffect(() => { api<Plan[]>('/plans').then(setPlans).catch(e => setError(e.message)); }, []);

  function choose(plan: Plan) {
    sessionStorage.setItem('selected_plan', JSON.stringify(plan));
    if (user?.role === 'CUSTOMER') navigate('/checkout');
    else if (user) navigate(homePath(user.role));
    else navigate('/cadastro');
  }

  return <>
    <PublicHeader />
    <main className="public-page plans-page launch-plans">
      <div className="eyebrow">👑 OFERTA DE LANÇAMENTO</div>
      <h1 className="center-title"><span>XNaMai</span> Club</h1>
      <p className="center-subtitle">Um plano só no lançamento: de R$ 299,97 por R$ 149,97/mês.</p>
      {error && <div className="error-box">{error}. Inicie o backend para carregar os planos reais.</div>}
      <div className="plans-grid">
        {plans.map((plan) => (
          <article className="plan-card featured" key={plan.id}>
            <div className="recommended">★ LANÇAMENTO</div>
            <div className="plan-icon"><Diamond /></div>
            <h3>{plan.name}</h3>
            <PlanPrice plan={plan} />
            <div className="limit">{plan.description}</div>
            <ul>
              <li><Check /> Preços diferenciados</li>
              <li><Check /> Acesso ao XNaMai Club</li>
              <li><Check /> Ofertas exclusivas</li>
              <li><Check /> Atendimento prioritário</li>
              <li><Check /> Condições especiais</li>
            </ul>
            <button className="btn primary" onClick={() => choose(plan)}>Assinar plano</button>
          </article>
        ))}
      </div>
    </main>
  </>;
}
