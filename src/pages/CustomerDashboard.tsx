import { useEffect, useState } from 'react';
import { CalendarDays, CheckCircle2, CreditCard, ReceiptText } from 'lucide-react';
import { api, money } from '../api/client';
import { PublicHeader } from '../components/PublicHeader';

type Invoice = {
  id: string;
  createdAt: string;
  paidAt?: string | null;
  status: string;
  amountCents: number;
  subscription?: { plan?: { name?: string } };
};

type Dashboard = {
  subscription: {
    status?: string;
    currentPeriodEnd?: string;
    plan?: { name?: string; monthlyPriceCents?: number | null };
  } | null;
  paymentMethod: {
    type?: string;
    cardBrand?: string | null;
    cardLastFour?: string | null;
  } | null;
  invoices: Invoice[];
};

const statusLabel: Record<string, string> = {
  PAID: 'Pago',
  PENDING: 'Pendente',
  FAILED: 'Falhou',
  CANCELLED: 'Cancelado',
};

export function CustomerDashboard() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<Dashboard>('/me/dashboard').then(setData).catch((e) => setError(e.message));
  }, []);

  const invoices = data?.invoices ?? [];
  const planName = data?.subscription?.plan?.name || 'XNaMai Club';

  return (
    <>
      <PublicHeader />
      <main className="dashboard-page">
        <div className="dashboard-heading">
          <h1>Área do cliente</h1>
          <p>Acompanhe sua assinatura e cobranças do XNaMai Club.</p>
        </div>
        {error && <div className="error-box">{error} — escolha um plano e conclua a assinatura para popular esta tela.</div>}
        {data && (
          <>
            <section className="customer-top">
              <div className="panel current-plan">
                <div>
                  <small>PLANO ATUAL</small>
                  <h2>{data.subscription?.plan?.name || 'Sem plano'}</h2>
                  <div className="big-number">{money(data.subscription?.plan?.monthlyPriceCents)}<small>/mês</small></div>
                </div>
                <div className="status-line"><CheckCircle2 /><span>Status</span><b>{data.subscription?.status}</b></div>
                <div className="status-line">
                  <CreditCard />
                  <span>Pagamento</span>
                  <b>
                    {data.paymentMethod?.type === 'CREDIT_CARD'
                      ? `${data.paymentMethod.cardBrand || 'Cartão'} •••• ${data.paymentMethod.cardLastFour || '----'}`
                      : 'PIX recorrente'}
                  </b>
                </div>
              </div>
              <div className="metric-card">
                <CheckCircle2 />
                <span>Status da assinatura</span>
                <strong>{data.subscription?.status || '—'}</strong>
              </div>
              <div className="metric-card">
                <CalendarDays />
                <span>Próxima cobrança</span>
                <strong>
                  {data.subscription?.currentPeriodEnd
                    ? new Date(data.subscription.currentPeriodEnd).toLocaleDateString('pt-BR')
                    : '—'}
                </strong>
              </div>
            </section>
            <section className="panel table-panel">
              <div className="section-title"><ReceiptText /><h2>Últimas cobranças</h2></div>
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Status</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length === 0 && (
                    <tr>
                      <td colSpan={4}>Nenhuma cobrança encontrada ainda. Recarregue a página após o pagamento na Stripe.</td>
                    </tr>
                  )}
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td>{new Date(inv.paidAt || inv.createdAt).toLocaleDateString('pt-BR')}</td>
                      <td>Mensalidade {inv.subscription?.plan?.name || planName}</td>
                      <td>
                        <span className={`badge ${inv.status === 'PAID' ? 'success' : 'danger'}`}>
                          {statusLabel[inv.status] || inv.status}
                        </span>
                      </td>
                      <td>{money(inv.amountCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        )}
      </main>
    </>
  );
}
