import { useEffect, useState } from 'react';
import { api, money } from '../api/client';
import { AdminHeader } from '../components/AdminShell';
import { StatusBadge, formatDate, subscriptionStatusLabel } from './adminShared';

type AdminCustomer = {
  id: string;
  name?: string;
  email?: string;
  companyName?: string | null;
  document?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  createdAt: string;
  subscription?: {
    status?: string;
    currentPeriodEnd?: string | null;
    plan?: { name?: string; monthlyPriceCents?: number | null } | null;
  } | null;
};

function formatDocument(value?: string | null) {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length === 11) return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (digits.length === 14) return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  return value;
}

export function AdminCustomers() {
  const [rows, setRows] = useState<AdminCustomer[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<AdminCustomer[]>('/admin/customers').then(setRows).catch((e) => setError(e.message));
  }, []);

  return (
    <>
      <AdminHeader
        title="Clientes"
        subtitle="Cadastros do clube e o plano atual de cada um."
      />
      {error && <div className="error-box">{error}</div>}
      {!rows && !error && <p className="admin-loading">Carregando clientes…</p>}
      {rows && (
        <section className="panel table-panel">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Empresa</th>
                <th>Plano</th>
                <th>Status</th>
                <th>Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={5}>Nenhum cliente cadastrado.</td></tr>
              )}
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.name || '—'}</strong>
                    <div className="cell-muted">{row.email}</div>
                    {row.phone && <div className="cell-muted">{row.phone}</div>}
                  </td>
                  <td>
                    {row.companyName || '—'}
                    {(row.city || row.state) && (
                      <div className="cell-muted">{[row.city, row.state].filter(Boolean).join(' / ')}</div>
                    )}
                    {row.document && <div className="cell-muted">{formatDocument(row.document)}</div>}
                  </td>
                  <td>
                    {row.subscription?.plan?.name || 'Sem plano'}
                    {row.subscription?.plan?.monthlyPriceCents != null && (
                      <div className="cell-muted">{money(row.subscription.plan.monthlyPriceCents)}/mês</div>
                    )}
                  </td>
                  <td>
                    {row.subscription
                      ? <StatusBadge status={row.subscription.status || ''} labels={subscriptionStatusLabel} />
                      : <span className="badge pending">Sem assinatura</span>}
                  </td>
                  <td>{formatDate(row.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}
