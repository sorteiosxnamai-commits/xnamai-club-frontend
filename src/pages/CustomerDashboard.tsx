import { useEffect, useState } from 'react';
import { CalendarDays, CheckCircle2, CreditCard, ReceiptText } from 'lucide-react';
import { Link } from 'react-router-dom';
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
    id?: string;
    status?: string;
    currentPeriodEnd?: string;
    cancelledAt?: string | null;
    plan?: { name?: string; monthlyPriceCents?: number | null };
  } | null;
  paymentMethod: {
    type?: string;
    cardBrand?: string | null;
    cardLastFour?: string | null;
  } | null;
  invoices: Invoice[];
};

const invoiceStatusLabel: Record<string, string> = {
  PAID: 'Pago',
  PENDING: 'Pendente',
  FAILED: 'Falhou',
  CANCELLED: 'Cancelado',
};

const subscriptionStatusLabel: Record<string, string> = {
  PENDING: 'Pendente',
  ACTIVE: 'Ativa',
  PAYMENT_FAILED: 'Pagamento recusado',
  PAST_DUE: 'Em atraso',
  SUSPENDED: 'Suspensa',
  CANCELLED: 'Cancelada',
};

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('pt-BR');
}

export function CustomerDashboard() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function loadDashboard() {
    const dashboard = await api<Dashboard>('/me/dashboard');
    setData(dashboard);
  }

  useEffect(() => {
    loadDashboard().catch((e) => setError(e.message));
  }, []);

  const invoices = data?.invoices ?? [];
  const planName = data?.subscription?.plan?.name || 'XNaMai Club';
  const subscription = data?.subscription;
  const isCancelled = subscription?.status === 'CANCELLED';
  const cancelScheduled = Boolean(subscription?.cancelledAt) && !isCancelled;
  const canCancel = Boolean(subscription?.id) && !isCancelled && !cancelScheduled;
  const accessUntil = formatDate(subscription?.currentPeriodEnd);
  const statusText = cancelScheduled
    ? 'Cancelamento agendado'
    : subscriptionStatusLabel[subscription?.status || ''] || subscription?.status || '—';

  async function cancelSubscription() {
    if (!subscription?.id || busy) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await api(`/subscriptions/${subscription.id}/cancel`, { method: 'POST' });
      setConfirming(false);
      await loadDashboard();
      setSuccess(
        subscription.currentPeriodEnd
          ? `Cancelamento confirmado. Você continua com acesso até ${accessUntil} e não haverá novas cobranças.`
          : 'Cancelamento confirmado. Não haverá novas cobranças.',
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PublicHeader />
      <main className="dashboard-page">
        <div className="dashboard-heading">
          <h1>Área do cliente</h1>
          <p>Acompanhe sua assinatura e cobranças do XNaMai Club.</p>
        </div>
        {error && (
          <div className="error-box">
            {error}
            {!data && ' — escolha um plano e conclua a assinatura para popular esta tela.'}
          </div>
        )}
        {success && <div className="success-box">{success}</div>}
        {data && (
          <>
            <section className="customer-top">
              <div className="panel current-plan">
                <div>
                  <small>PLANO ATUAL</small>
                  <h2>{subscription?.plan?.name || 'Sem plano'}</h2>
                  <div className="big-number">{money(subscription?.plan?.monthlyPriceCents)}<small>/mês</small></div>
                </div>
                <div className="status-line"><CheckCircle2 /><span>Status</span><b>{statusText}</b></div>
                <div className="status-line">
                  <CreditCard />
                  <span>Pagamento</span>
                  <b>
                    {data.paymentMethod?.type === 'CREDIT_CARD'
                      ? `${data.paymentMethod.cardBrand || 'Cartão'} •••• ${data.paymentMethod.cardLastFour || '----'}`
                      : 'PIX recorrente'}
                  </b>
                </div>
                {subscription?.id && (
                  <div className="plan-actions">
                    {canCancel && !confirming && (
                      <button className="btn danger" type="button" onClick={() => setConfirming(true)}>
                        Cancelar assinatura
                      </button>
                    )}
                    {canCancel && confirming && (
                      <>
                        <p>
                          Tem certeza? O acesso aos preços do Club permanece até {accessUntil}.
                          Depois disso a assinatura encerra e não haverá novas cobranças.
                        </p>
                        <div className="cancel-confirm">
                          <button className="btn ghost" type="button" disabled={busy} onClick={() => setConfirming(false)}>
                            Manter assinatura
                          </button>
                          <button className="btn danger" type="button" disabled={busy} onClick={cancelSubscription}>
                            {busy ? 'Cancelando…' : 'Confirmar cancelamento'}
                          </button>
                        </div>
                      </>
                    )}
                    {cancelScheduled && (
                      <p>
                        Cancelamento solicitado. Você continua com acesso até <strong>{accessUntil}</strong> e não haverá novas cobranças.
                      </p>
                    )}
                    {isCancelled && (
                      <>
                        <p>Assinatura cancelada. O acesso aos preços exclusivos do Club foi encerrado.</p>
                        <Link className="btn primary" to="/planos">Assinar novamente</Link>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="metric-card">
                <CheckCircle2 />
                <span>Status da assinatura</span>
                <strong>{statusText}</strong>
              </div>
              <div className="metric-card">
                <CalendarDays />
                <span>{isCancelled ? 'Encerrada em' : cancelScheduled ? 'Acesso até' : 'Próxima cobrança'}</span>
                <strong>
                  {isCancelled
                    ? formatDate(subscription?.cancelledAt)
                    : accessUntil}
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
                      <td>{formatDate(inv.paidAt || inv.createdAt)}</td>
                      <td>Mensalidade {inv.subscription?.plan?.name || planName}</td>
                      <td>
                        <span className={`badge ${inv.status === 'PAID' ? 'success' : 'danger'}`}>
                          {invoiceStatusLabel[inv.status] || inv.status}
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
