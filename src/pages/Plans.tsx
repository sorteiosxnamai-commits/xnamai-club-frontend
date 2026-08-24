import { useEffect, useState } from 'react';
import { Check, Crown, Diamond, Rocket, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, money } from '../api/client';
import { PublicHeader } from '../components/PublicHeader';

export type Plan = { id: string; code: string; name: string; monthlyPriceCents: number | null; purchaseLimitCents: number | null; description: string };

const icons = [Rocket, TrendingUp, Diamond, Crown, Crown];

export function Plans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  useEffect(() => { api<Plan[]>('/plans').then(setPlans).catch(e => setError(e.message)); }, []);

  function choose(plan: Plan) {
    if (plan.code === 'ENTERPRISE') return alert('Fluxo Enterprise: integrar formulário comercial/CRM.');
    sessionStorage.setItem('selected_plan', JSON.stringify(plan));
    navigate('/cadastro');
  }

  return <>
    <PublicHeader />
    <main className="public-page plans-page">
      <div className="eyebrow">👑 CLUBE DE VANTAGENS EXCLUSIVAS</div>
      <h1 className="center-title"><span>XNaMai</span> Club</h1>
      <p className="center-subtitle">Escolha o plano ideal para comprar mais e pagar menos.</p>
      {error && <div className="error-box">{error}. Inicie o backend para carregar os planos reais.</div>}
      <div className="plans-grid">
        {plans.map((plan, i) => {
          const Icon = icons[i] || Diamond;
          const featured = plan.code === 'PRO';
          return <article className={`plan-card ${featured ? 'featured' : ''}`} key={plan.id}>
            {featured && <div className="recommended">★ MAIS ESCOLHIDO</div>}
            <div className="plan-icon"><Icon/></div>
            <h3>{plan.name}</h3>
            <div className="price">{money(plan.monthlyPriceCents)}{plan.monthlyPriceCents != null && <small>/mês</small>}</div>
            <div className="limit">{plan.description}</div>
            <ul>
              <li><Check/> Preços diferenciados</li>
              <li><Check/> Acesso ao XNaMai Club</li>
              <li><Check/> Ofertas exclusivas</li>
              {i > 0 && <li><Check/> Atendimento prioritário</li>}
              {i > 1 && <li><Check/> Condições especiais</li>}
            </ul>
            <button className={`btn ${featured ? 'primary' : 'plan-btn'}`} onClick={() => choose(plan)}>{plan.code === 'ENTERPRISE' ? 'Falar com especialista' : 'Assinar plano'}</button>
          </article>;
        })}
      </div>
    </main>
  </>;
}
