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
};

export function badgeClass(status: string) {
  if (status === 'ACTIVE' || status === 'PAID') return 'success';
  if (status === 'PENDING') return 'pending';
  return 'danger';
}

export function StatusBadge({ status, labels }: { status: string; labels: Record<string, string> }) {
  return <span className={`badge ${badgeClass(status)}`}>{labels[status] || status}</span>;
}
