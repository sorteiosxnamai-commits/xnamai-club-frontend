import { useEffect, useState } from 'react';
import { BadgeDollarSign, CalendarClock, CalendarDays } from 'lucide-react';
import { api, money } from '../api/client';
import { AdminHeader } from '../components/AdminShell';
import { RevenueBars, StatusBadge, formatDate, invoiceStatusLabel, type MonthRevenue } from './adminShared';

type PaymentRow = {
  id: string;
  amountCents: number;
  status: string;
  dueDate?: string | null;
  paidAt?: string | null;
  createdAt?: string;
  plan?: { name?: string } | null;
  customer?: { name?: string; email?: string } | null;
};

type PaymentsPayload = {
  nextMonthForecastCents: number;
  yearForecastCents: number;
  forecastSubscribers: number;
  forecastByMonth: MonthRevenue[];
  upcoming: PaymentRow[];
  invoices: PaymentRow[];
};

export function AdminPayments() {
  const [data, setData] = useState<PaymentsPayload | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<PaymentsPayload>('/admin/payments').then(setData).catch((e) => setError(e.message));
  }, []);

  return (
    <>
      <AdminHeader
        title="Cobranças"
        subtitle="Próximas renovações, previsão de receita e faturas já sincronizadas."
      />
      {error && <div className="error-box">{error}</div>}
      {!data && !error && <p className="admin-loading">Carregando cobranças…</p>}
      {data && (
        <>
          <section className="kpi-grid forecast-kpis">
            <div className="kpi positive">
              <div className="kpi-icon"><CalendarClock /></div>
              <div>
                <span>Próximo mês</span>
                <strong>{money(data.nextMonthForecastCents)}</strong>
                <small>Receita esperada na próxima renovação</small>
              </div>
            </div>
            <div className="kpi positive">
              <div className="kpi-icon"><BadgeDollarSign /></div>
              <div>
                <span>Previsão 12 meses</span>
                <strong>{money(data.yearForecastCents)}</strong>
                <small>{data.forecastSubscribers} assinaturas na base</small>
              </div>
            </div>
            <div className="kpi">
              <div className="kpi-icon"><CalendarDays /></div>
              <div>
                <span>Próximas cobranças</span>
                <strong>{String(data.upcoming.length)}</strong>
                <small>Renovações ainda não faturadas</small>
              </div>
            </div>
          </section>

          <section className="panel chart-card forecast-panel">
            <div className="section-title">
              <h2>Previsão de receitas futuras</h2>
              <strong>{money(data.yearForecastCents)}</strong>
            </div>
            <RevenueBars months={data.forecastByMonth ?? []} className="forecast-chart" />
          </section>

          <section className="panel table-panel">
            <div className="section-title">
              <h2>Próximas cobranças</h2>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Cliente</th>
                  <th>Descrição</th>
                  <th>Status</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {data.upcoming.length === 0 && (
                  <tr><td colSpan={5}>Nenhuma renovação agendada no momento.</td></tr>
                )}
                {data.upcoming.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDate(row.dueDate)}</td>
                    <td>
                      <strong>{row.customer?.name || '—'}</strong>
                      <div className="cell-muted">{row.customer?.email}</div>
                    </td>
                    <td>Mensalidade {row.plan?.name || 'XNaMai Club'}</td>
                    <td><StatusBadge status={row.status} labels={invoiceStatusLabel} /></td>
                    <td>{money(row.amountCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="panel table-panel">
            <div className="section-title">
              <h2>Cobranças registradas</h2>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Cliente</th>
                  <th>Descrição</th>
                  <th>Status</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {data.invoices.length === 0 && (
                  <tr><td colSpan={5}>Nenhuma cobrança encontrada ainda.</td></tr>
                )}
                {data.invoices.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDate(row.paidAt || row.dueDate || row.createdAt)}</td>
                    <td>
                      <strong>{row.customer?.name || '—'}</strong>
                      <div className="cell-muted">{row.customer?.email}</div>
                    </td>
                    <td>Mensalidade {row.plan?.name || 'XNaMai Club'}</td>
                    <td><StatusBadge status={row.status} labels={invoiceStatusLabel} /></td>
                    <td>{money(row.amountCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </>
  );
}
