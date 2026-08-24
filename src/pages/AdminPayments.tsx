import { useEffect, useState } from 'react';
import { api, money } from '../api/client';
import { AdminHeader } from '../components/AdminShell';
import { StatusBadge, formatDate, invoiceStatusLabel } from './adminShared';

type AdminPayment = {
  id: string;
  amountCents: number;
  status: string;
  dueDate?: string | null;
  paidAt?: string | null;
  createdAt: string;
  plan?: { name?: string } | null;
  customer?: { name?: string; email?: string } | null;
};

export function AdminPayments() {
  const [rows, setRows] = useState<AdminPayment[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<AdminPayment[]>('/admin/payments').then(setRows).catch((e) => setError(e.message));
  }, []);

  return (
    <>
      <AdminHeader
        title="Cobranças"
        subtitle="Faturas sincronizadas da Stripe e do clube."
      />
      {error && <div className="error-box">{error}</div>}
      {!rows && !error && <p className="admin-loading">Carregando cobranças…</p>}
      {rows && (
        <section className="panel table-panel">
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
              {rows.length === 0 && (
                <tr><td colSpan={5}>Nenhuma cobrança encontrada ainda.</td></tr>
              )}
              {rows.map((row) => (
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
      )}
    </>
  );
}
