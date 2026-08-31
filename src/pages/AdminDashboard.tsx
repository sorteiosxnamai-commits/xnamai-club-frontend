import { useEffect, useState, type ReactNode } from 'react';
import { AlertCircle, BadgeDollarSign, CalendarClock, CheckCircle2, TrendingDown, TrendingUp, Users } from 'lucide-react';
import { api, money } from '../api/client';
import { AdminHeader } from '../components/AdminShell';
import { RevenueBars, type MonthRevenue } from './adminShared';

type Metrics = {
  activeSubscribers: number;
  complianceRate: number;
  rejectedPayments: number;
  monthlyRevenueCents: number;
  previousRevenueCents: number;
  growthPercent: number;
  newSubscribers: number;
  revenueByMonth: MonthRevenue[];
  nextMonthForecastCents: number;
  yearForecastCents: number;
  forecastSubscribers: number;
  forecastByMonth: MonthRevenue[];
};

const EMPTY_MONTHS: MonthRevenue[] = [];

export function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<Metrics>('/admin/dashboard').then(setMetrics).catch((e) => setError(e.message));
  }, []);

  return (
    <>
      <AdminHeader
        title="Dashboard do Clube"
        subtitle="Acompanhe assinaturas, cobranças e crescimento do XNaMai Club."
      />
      {error && <div className="error-box">{error}</div>}
      {!metrics && !error && <p className="admin-loading">Carregando métricas reais…</p>}
      {metrics && <DashboardBody metrics={metrics} />}
    </>
  );
}

function DashboardBody({ metrics }: { metrics: Metrics }) {
  const months = metrics.revenueByMonth ?? EMPTY_MONTHS;
  const forecastMonths = metrics.forecastByMonth ?? EMPTY_MONTHS;
  const growing = metrics.growthPercent > 0;
  const shrinking = metrics.growthPercent < 0;
  const tone = growing ? 'ok' : shrinking ? 'warn' : 'neutral';
  const InsightIcon = shrinking ? TrendingDown : TrendingUp;
  const subscriberLabel = metrics.newSubscribers === 1 ? 'novo assinante' : 'novos assinantes';

  return (
    <>
      <section className="kpi-grid">
        <Kpi icon={<Users />} title="Assinantes ativos" value={String(metrics.activeSubscribers)} note="Base ativa do clube" />
        <Kpi
          icon={<CheckCircle2 />}
          title="Adimplência"
          value={`${metrics.complianceRate}%`}
          note="Pagamentos em dia na base ativa"
          positive={metrics.complianceRate >= 95}
          danger={metrics.complianceRate < 80}
        />
        <Kpi
          icon={<AlertCircle />}
          title="Pagamentos recusados"
          value={String(metrics.rejectedPayments)}
          note="Falhas neste mês"
          danger={metrics.rejectedPayments > 0}
        />
        <Kpi
          icon={<BadgeDollarSign />}
          title="Receita mensal"
          value={money(metrics.monthlyRevenueCents)}
          note="Receita recebida neste mês"
          positive={metrics.monthlyRevenueCents > 0}
        />
        <Kpi
          icon={<TrendingUp />}
          title="Crescimento"
          value={`${metrics.growthPercent >= 0 ? '+' : ''}${metrics.growthPercent}%`}
          note={metrics.previousRevenueCents > 0 ? `vs ${money(metrics.previousRevenueCents)} no mês anterior` : 'vs mês anterior'}
          positive={growing}
          danger={shrinking}
        />
      </section>
      <section className="admin-grid">
        <div className="panel chart-card">
          <div className="section-title">
            <h2>Receita mensal</h2>
            <strong>{money(metrics.monthlyRevenueCents)}</strong>
          </div>
          <RevenueBars months={months} />
        </div>
        <div className={`panel admin-positive ${tone}`}>
          <InsightIcon />
          <h2>{growing ? 'Performance positiva' : shrinking ? 'Receita em queda' : 'Aguardando volume'}</h2>
          <strong>{metrics.newSubscribers} {subscriberLabel}</strong>
          <p>
            {metrics.activeSubscribers === 0
              ? 'Ainda não há assinantes ativos neste ambiente.'
              : growing
                ? 'O clube cresceu em receita frente ao mês anterior.'
                : shrinking
                  ? 'A receita deste mês ficou abaixo do período anterior.'
                  : 'Os números abaixo refletem as cobranças já confirmadas.'}
          </p>
        </div>
      </section>
      <section className="admin-grid forecast-grid">
        <div className="panel chart-card">
          <div className="section-title">
            <h2>Previsão de receita — 12 meses</h2>
            <strong>{money(metrics.yearForecastCents)}</strong>
          </div>
          <p className="forecast-copy">Com base nas assinaturas ativas, cada mês seguinte repete a mensalidade corrente.</p>
          <RevenueBars months={forecastMonths} className="forecast-chart" />
        </div>
        <div className="panel admin-positive">
          <CalendarClock />
          <h2>Próximo mês</h2>
          <strong>{money(metrics.nextMonthForecastCents)}</strong>
          <p>
            {metrics.forecastSubscribers === 0
              ? 'Sem assinaturas recorrentes para projetar.'
              : `Receita esperada de ${metrics.forecastSubscribers} ${metrics.forecastSubscribers === 1 ? 'assinante' : 'assinantes'} na próxima renovação.`}
          </p>
        </div>
      </section>
      <section className={`positive-strip ${tone}`}>
        <div>
          <BadgeDollarSign />
          <span>
            <b>{metrics.monthlyRevenueCents > 0 ? 'Receita no mês' : 'Sem receita neste mês'}</b>
            {money(metrics.monthlyRevenueCents)} recebidos
          </span>
        </div>
        <div>
          <InsightIcon />
          <span>
            <b>{growing ? 'Crescimento' : shrinking ? 'Recuo' : 'Sem variação'}</b>
            {metrics.growthPercent}% vs mês anterior
          </span>
        </div>
        <div>
          <CheckCircle2 />
          <span>
            <b>{metrics.complianceRate >= 95 ? 'Adimplência saudável' : 'Adimplência'}</b>
            {metrics.complianceRate}% em dia
          </span>
        </div>
      </section>
    </>
  );
}

function Kpi({
  icon,
  title,
  value,
  note,
  positive,
  danger,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  note: string;
  positive?: boolean;
  danger?: boolean;
}) {
  return (
    <div className={`kpi ${positive ? 'positive' : ''} ${danger ? 'danger' : ''}`}>
      <div className="kpi-icon">{icon}</div>
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </div>
  );
}
