import { useEffect, useState } from 'react';
import { api, money } from '../api/client';
import { AdminHeader } from '../components/AdminShell';
import { StatusBadge, formatDate, subscriptionStatusLabel } from './adminShared';

type AdminSubscription = {
  id: string;
  status: string;
  startedAt?: string | null;
  currentPeriodEnd?: string | null;
  createdAt: string;
  plan?: { name?: string; monthlyPriceCents?: number | null } | null;
  customer?: { name?: string; email?: string; companyName?: string | null } | null;
};

export function AdminSubscriptions() {
  const [rows, setRows] = useState<AdminSubscription[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<AdminSubscription[]>('/admin/subscriptions').then(setRows).catch((e) => setError(e.message));
  }, []);

  return (
    <>
      <AdminHeader
        title="Assinaturas"
        subtitle="Planos ativos, pendentes e cancelados do XNaMai Club."
      />
      {error && <div className="error-box">{error}</div>}
      {!rows && !error && <p className="admin-loading">Carregando assinaturas…</p>}
      {rows && (
        <section className="panel table-panel">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Plano</th>
                <th>Status</th>
                <th>Valor</th>
                <th>Início</th>
                <th>Próxima cobrança</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={6}>Nenhuma assinatura encontrada.</td></tr>
              )}
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.customer?.name || '—'}</strong>
                    <div className="cell-muted">{row.customer?.email}</div>
                    {row.customer?.companyName && <div className="cell-muted">{row.customer.companyName}</div>}
                  </td>
                  <td>{row.plan?.name || '—'}</td>
                  <td><StatusBadge status={row.status} labels={subscriptionStatusLabel} /></td>
                  <td>{money(row.plan?.monthlyPriceCents)}</td>
                  <td>{formatDate(row.startedAt || row.createdAt)}</td>
                  <td>{formatDate(row.currentPeriodEnd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}
