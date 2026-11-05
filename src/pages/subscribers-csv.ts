export type SubscriberExportRow = {
  gatewaySubscriptionId?: string | null;
  currentPeriodEnd?: string | null;
  plan?: { name?: string; monthlyPriceCents?: number | null } | null;
  customer?: { name?: string; email?: string; phone?: string | null } | null;
};

function cell(value: string) {
  const text = value.replace(/\r?\n/g, ' ').trim();
  if (/[;"\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function money(cents?: number | null) {
  if (cents == null) return '';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

function dateLabel(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-BR');
}

export function buildSubscribersCsv(rows: SubscriberExportRow[]) {
  const header = ['Nome', 'E-mail', 'Telefone', 'Plano', 'Valor', 'Frequência', 'Próxima cobrança'];
  const lines = rows.map((row) => [
    row.customer?.name || '',
    row.customer?.email || '',
    row.customer?.phone || '',
    row.plan?.name || '',
    money(row.plan?.monthlyPriceCents),
    row.gatewaySubscriptionId ? 'Mensal' : 'Avulsa',
    dateLabel(row.currentPeriodEnd),
  ].map(cell).join(';'));
  return `\uFEFF${[header.join(';'), ...lines].join('\n')}\n`;
}

export function downloadSubscribersCsv(rows: SubscriberExportRow[]) {
  const blob = new Blob([buildSubscribersCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const day = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `assinantes-${day}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
