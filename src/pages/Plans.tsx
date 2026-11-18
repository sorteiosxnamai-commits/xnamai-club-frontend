import { usePageText } from '../content/ContentContext';
import { useEffect, useState } from 'react';
import { Check, Diamond } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, money } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { homePath } from '../auth/roles';
import { PublicHeader } from '../components/PublicHeader';
import { logAppEvent } from '../telemetry';
import { asaasOffer } from '../asaas';

export type Plan = {
  id: string;
  code: string;
  name: string;
  monthlyPriceCents: number | null;
  compareAtPriceCents?: number | null;
  purchaseLimitCents: number | null;
  description: string;
  availability?: { capacity: number; remaining: number };
};

type CurrentSubscription = {
  status?: string;
  plan?: { id?: string; code?: string } | null;
};

export function planBenefits(plan: Plan) {
  if (plan.code === 'PRIORITY') return [
    'Todas as vantagens do Sócio Xnamai',
    'Fura fila: pedido no mesmo dia',
    'Antecedência mínima de 6 horas',
    'Prioridade na separação do pedido',
    'XNaMai Lab — exclusivo para os 50 sócios',
  ];
  return [
    'Preços exclusivos para sócios',
    'Compre sem precisar fechar caixa',
    'Pedido com antecedência mínima de 24 horas',
  ];
}

export function PlanPrice({ plan }: { plan: Plan }) {
  const offer = asaasOffer(plan.code);
  if (offer) return <div className="price">
    <span className="price-was">{money(offer.original)}/mês</span>
    <span className="price-now">{money(offer.card)}<small>/mês no cartão</small></span>
    <span className="launch-save">Lançamento: selecione a recorrência no aplicativo ou site.</span>
    <span className="launch-save">No PIX: {money(offer.pix)}/mês no lançamento.</span>
  </div>;
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
  const t = usePageText('plans');
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
      <div className="eyebrow">CATEGORIAS DE SÓCIO</div>
      <h1 className="center-title">Escolha como você quer <span>fazer parte</span></h1>
      <p className="center-subtitle">{t("memberSubtitle", "Duas formas de aproveitar as vantagens do Club Xnamai.")}</p>
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
            <div className="recommended">{priority ? 'SÓCIO PRIME — 50 VAGAS' : 'SÓCIO XNAMAI'}</div>
            <div className="plan-icon"><Diamond /></div>
            <h3>{asaasOffer(plan.code)?.name ?? plan.name}</h3>
            <PlanPrice plan={plan} />
            <p>{t("memberEligibility", "Exclusivo para lojistas e empreendedores com CNPJ.")}</p>
            <div className="plan-promise">
              <strong>{priority ? 'Prioridade na separação e XNaMai Lab' : 'Preços exclusivos para sócios'}</strong>
              {priority && (
                <p>{t("fastDescription", "Faça seu pedido com antecedência mínima de 6 horas para separação e envio no mesmo dia, dentro do nosso horário de operação.")}</p>
              )}
            </div>
            <div className={`plan-speed${priority ? ' fast' : ''}`}>
              <span>{priority ? 'PRIORIDADE' : 'BASIC'}</span>
              <strong>{priority ? '6H' : '24H'}</strong>
              <small>antecedência mínima</small>
            </div>
            <ul>
              {planBenefits(plan).map((benefit, index) => <li key={index}><Check /> {t(`member${plan.code}Benefit${index}`, benefit)}</li>)}
            </ul>
            {priority && (
              <>
                <div className="plan-capacity">
                  <strong>🔒 APENAS 50 CLIENTES</strong>
                  <p>{t("memberCapacity", "O Sócio Prime é limitado a 50 participantes para que a prioridade de separação funcione.")}</p>
                </div>
                <div className="plan-lab">
                  <strong>🔬 XNaMai Lab</strong>
                  <p><b>{t("labIntro", "Grupo exclusivo para até 50 membros.")}</b>{t("labDescription", " Receba catálogos de novos produtos e participe da escolha dos produtos que poderão entrar no site da XNaMai conforme a demanda.")}</p>
                </div>
              </>
            )}
            <button
              className="btn primary"
              disabled={current || included || (priority && plan.availability?.remaining === 0)}
              onClick={() => choose(plan)}
            >
              {current ? 'SUA CATEGORIA' : included ? 'INCLUSO NA SUA CATEGORIA' : priority && plan.availability?.remaining === 0 ? 'VAGAS ESGOTADAS' : upgrade ? 'QUERO SER SÓCIO PRIME' : priority ? 'QUERO SER SÓCIO PRIME' : 'QUERO SER SÓCIO'}
            </button>
          </article>
          );
        })}
      </div>
    </main>
  </>;
}
