import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AlertCircle, BadgeDollarSign, CheckCircle2, LayoutDashboard, ReceiptText, TrendingDown, TrendingUp, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, money } from '../api/client';
import { Brand } from '../components/Brand';
import { useAuth } from '../auth/AuthContext';

type MonthRevenue = { key: string; label: string; revenueCents: number };

type Metrics = {
  activeSubscribers: number;
  complianceRate: number;
  rejectedPayments: number;
  monthlyRevenueCents: number;
  previousRevenueCents: number;
  growthPercent: number;
  newSubscribers: number;
  revenueByMonth: MonthRevenue[];
};

const EMPTY_MONTHS: MonthRevenue[] = [];

export function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState('');
  const { logout } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    api<Metrics>('/admin/dashboard').then(setMetrics).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Brand admin />
        <nav>
          <a className="active"><LayoutDashboard />Dashboard</a>
          <a><Users />Assinaturas</a>
          <a><ReceiptText />Cobranças</a>
          <a><Users />Clientes</a>
        </nav>
        <button className="btn ghost full" onClick={() => { logout(); nav('/'); }}>Sair</button>
      </aside>
      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>Dashboard do Clube</h1>
            <p>Acompanhe assinaturas, cobranças e crescimento do XNaMai Club.</p>
          </div>
          <span className="admin-chip">Admin XNaMai</span>
        </header>
        {error && <div className="error-box">{error}</div>}
        {!metrics && !error && <p className="admin-loading">Carregando métricas reais…</p>}
        {metrics && <DashboardBody metrics={metrics} />}
      </main>
    </div>
  );
}

function DashboardBody({ metrics }: { metrics: Metrics }) {
  const months = metrics.revenueByMonth ?? EMPTY_MONTHS;
  const maxRevenue = useMemo(
    () => Math.max(0, ...months.map((row) => row.revenueCents)),
    [months],
  );
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
          <div className="fake-chart">
            {months.map((row) => {
              const height = maxRevenue === 0 ? 8 : Math.max(8, Math.round((row.revenueCents / maxRevenue) * 100));
              return (
                <div key={row.key} style={{ height: `${height}%` }} className={row.revenueCents === 0 ? 'chart-bar-empty' : undefined}>
                  {row.revenueCents > 0 && <em>{money(row.revenueCents)}</em>}
                </div>
              );
            })}
          </div>
          <div className="chart-months">
            {months.map((row) => <span key={row.key}>{row.label}</span>)}
          </div>
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
