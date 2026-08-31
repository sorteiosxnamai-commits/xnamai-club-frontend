import { money } from '../api/client';

export function formatDate(value?: string | Date | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('pt-BR');
}

export const subscriptionStatusLabel: Record<string, string> = {
  PENDING: 'Pendente',
  ACTIVE: 'Ativa',
  PAYMENT_FAILED: 'Pagamento recusado',
  PAST_DUE: 'Em atraso',
  SUSPENDED: 'Suspensa',
  CANCELLED: 'Cancelada',
};

export const invoiceStatusLabel: Record<string, string> = {
  PAID: 'Pago',
  PENDING: 'Pendente',
  FAILED: 'Falhou',
  CANCELLED: 'Cancelado',
  UPCOMING: 'Agendada',
};

export function badgeClass(status: string) {
  if (status === 'ACTIVE' || status === 'PAID') return 'success';
  if (status === 'PENDING' || status === 'UPCOMING') return 'pending';
  return 'danger';
}

export function StatusBadge({ status, labels }: { status: string; labels: Record<string, string> }) {
  return <span className={`badge ${badgeClass(status)}`}>{labels[status] || status}</span>;
}

export type MonthRevenue = { key: string; label: string; revenueCents: number };

export function RevenueBars({ months, className }: { months: MonthRevenue[]; className?: string }) {
  const maxRevenue = Math.max(0, ...months.map((row) => row.revenueCents));
  return (
    <>
      <div className={`fake-chart ${className || ''}`}>
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
    </>
  );
}

