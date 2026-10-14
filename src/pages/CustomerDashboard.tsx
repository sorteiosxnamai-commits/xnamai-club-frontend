import { useEffect, useState } from 'react';
import { CalendarDays, CheckCircle2, CreditCard, ReceiptText } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, money } from '../api/client';
import { PIX_MONTH_PRICE_CENTS } from '../billing';
import { PublicHeader } from '../components/PublicHeader';

type Invoice = {
  id: string;
  createdAt: string;
  paidAt?: string | null;
  status: string;
  amountCents: number;
  subscription?: { plan?: { name?: string } };
};

type MembershipAccess = {
  active: boolean;
  validUntil?: string | null;
  renewed: boolean;
  renewedAt?: string | null;
};

type Dashboard = {
  subscription: {
    id?: string;
    status?: string;
    startedAt?: string | null;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    cancelledAt?: string | null;
    plan?: { id?: string; code?: string; name?: string; monthlyPriceCents?: number | null };
  } | null;
  paymentMethod: {
    type?: string;
    cardBrand?: string | null;
    cardLastFour?: string | null;
  } | null;
  invoices: Invoice[];
  access?: MembershipAccess;
};

const invoiceStatusLabel: Record<string, string> = {
  PAID: 'Pago',
  PENDING: 'Pendente',
  FAILED: 'Falhou',
  CANCELLED: 'Cancelado',
};

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('pt-BR');
}

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function CustomerDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cardBusy, setCardBusy] = useState(false);

  async function loadDashboard() {
    const dashboard = await api<Dashboard>('/me/dashboard');
    setData(dashboard);
  }

  useEffect(() => {
    const sessionId = searchParams.get('card_session_id');
    let ignore = false;

    async function start() {
      if (sessionId) {
        setCardBusy(true);
        try {
          const result = await api<{ message: string }>(
            `/subscriptions/payment-method/confirm?sessionId=${encodeURIComponent(sessionId)}`,
          );
          if (!ignore) setSuccess(result.message);
        } catch (e) {
          if (!ignore) setError((e as Error).message);
        } finally {
          if (!ignore) {
            const next = new URLSearchParams(searchParams);
            next.delete('card_session_id');
            setSearchParams(next, { replace: true });
            setCardBusy(false);
          }
        }
      }
      try {
        await loadDashboard();
      } catch (e) {
        if (!ignore) setError((e as Error).message);
      }
    }

    start();
    return () => {
      ignore = true;
    };
  }, [searchParams, setSearchParams]);

  const invoices = data?.invoices ?? [];
  const planName = data?.subscription?.plan?.name || 'XNaMai Club';
  const subscription = data?.subscription;
  const access = data?.access;
  const isCancelled = subscription?.status === 'CANCELLED';
  const cancelScheduled = Boolean(subscription?.cancelledAt) && !isCancelled;
  const isPix = data?.paymentMethod?.type === 'PIX_RECURRING';
  const canCancel = Boolean(subscription?.id) && !isCancelled && !cancelScheduled && !isPix;
  const canChangeCard = Boolean(subscription?.id) && !isCancelled && !isPix && data?.paymentMethod?.type !== 'BOLETO';
  const cardActionLabel = data?.paymentMethod?.type === 'CREDIT_CARD' ? 'Trocar cartão' : 'Cadastrar cartão';
  const canUpgrade = subscription?.status === 'ACTIVE' && !isPix && subscription.plan?.code === 'LAUNCH';
  const validUntil = access?.validUntil || subscription?.currentPeriodEnd;
  const accessUntil = formatDate(validUntil);
  const accessActive = Boolean(subscription?.id) && (access ? access.active : subscription?.status === 'ACTIVE');
  const statusText = !subscription?.id ? '—' : accessActive ? 'Ativo' : 'Inativo';
  const validityLabel = isCancelled ? 'Encerrada em' : isPix ? 'Vence em' : 'Válido até';
  const pixExpiresAt = access?.validUntil || subscription?.currentPeriodEnd;
  const pixMsLeft = pixExpiresAt ? new Date(pixExpiresAt).getTime() - Date.now() : null;
  const pixExpired = Boolean(isPix && pixMsLeft != null && pixMsLeft <= 0);
  const pixSoon = Boolean(isPix && pixMsLeft != null && pixMsLeft > 0 && pixMsLeft <= 7 * 24 * 60 * 60 * 1000);

  async function cancelSubscription() {
    if (!subscription?.id || busy) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await api(`/subscriptions/${subscription.id}/cancel`, { method: 'POST', body: '{}' });
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

  async function startUpgrade() {
    if (busy) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const plans = await api<Array<{
        id: string;
        code: string;
        name: string;
        monthlyPriceCents: number | null;
        compareAtPriceCents?: number | null;
        purchaseLimitCents: number | null;
        description: string;
      }>>('/plans');
      const priority = plans.find((plan) => plan.code === 'PRIORITY');
      if (!priority) throw new Error('Plano Prioridade indisponível no momento.');
      sessionStorage.setItem('selected_plan', JSON.stringify(priority));
      navigate('/checkout');
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  async function renewPix() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const plans = await api<Array<{
        id: string;
        code: string;
        name: string;
        monthlyPriceCents: number | null;
        compareAtPriceCents?: number | null;
        purchaseLimitCents: number | null;
        description: string;
      }>>('/plans');
      const current = plans.find((plan) => plan.code === subscription?.plan?.code) || plans[0];
      if (!current) throw new Error('Nenhum plano disponível para renovar.');
      sessionStorage.setItem('selected_plan', JSON.stringify(current));
      sessionStorage.setItem('checkout_method', 'PIX_RECURRING');
      navigate('/checkout');
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  async function changeCard() {
    if (cardBusy || busy) return;
    setCardBusy(true);
    setError('');
    setSuccess('');
    try {
      const result = await api<{ url: string }>('/subscriptions/payment-method', { method: 'POST', body: '{}' });
      window.location.href = result.url;
    } catch (e) {
      setError((e as Error).message);
      setCardBusy(false);
    }
  }

  async function resumeSubscription() {
    if (!subscription?.id || busy) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await api(`/subscriptions/${subscription.id}/resume`, { method: 'POST', body: '{}' });
      await loadDashboard();
      setSuccess('Assinatura retomada. Você continuará no Plano Basic normalmente.');
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
          <div className="error-box" role="alert">
            {error}
          </div>
        )}
        {success && <div className="success-box">{success}</div>}
        {data && isPix && (
          <div className={`pix-alert${pixExpired ? ' expired' : pixSoon ? ' soon' : ''}`} role="status">
            <strong>{pixExpired ? 'PIX vencido' : pixSoon ? 'PIX perto do vencimento' : 'PIX avulso'}</strong>
            <p>
              Entrada em <strong>{formatDateTime(subscription?.currentPeriodStart || subscription?.startedAt)}</strong>.
              O acesso vence em <strong>{formatDateTime(pixExpiresAt)}</strong> e não renova sozinho.
              {pixExpired ? ' O acesso está encerrado até o próximo PIX.' : ' Pague de novo antes desse horário para continuar.'}
            </p>
            <button className="btn primary" type="button" disabled={busy} onClick={renewPix}>
              {busy ? 'Abrindo PIX…' : 'Renovar com PIX'}
            </button>
          </div>
        )}
        {data && (
          <>
            <section className="customer-top">
              <div className="panel current-plan">
                <div>
                  <small>PLANO ATUAL</small>
                  <h2>{subscription?.plan?.name || 'Sem plano'}</h2>
                  <div className="big-number">{money(isPix ? PIX_MONTH_PRICE_CENTS : subscription?.plan?.monthlyPriceCents)}<small>/mês</small></div>
                </div>
                <div className="status-line"><CheckCircle2 /><span>Status</span><b>{statusText}</b></div>
                <div className="status-line">
                  <CalendarDays />
                  <span>{validityLabel}</span>
                  <b>{isCancelled ? formatDate(subscription?.cancelledAt) : isPix ? formatDateTime(pixExpiresAt) : accessUntil}</b>
                </div>
                <div className="status-line">
                  <CreditCard />
                  <span>Pagamento</span>
                  <b>
                    {data.paymentMethod?.type === 'CREDIT_CARD'
                      ? `${data.paymentMethod.cardBrand || 'Cartão'} •••• ${data.paymentMethod.cardLastFour || '----'}`
                      : data.paymentMethod?.type === 'PIX_RECURRING'
                        ? 'PIX'
                        : data.paymentMethod?.type === 'BOLETO'
                          ? 'Boleto'
                          : 'Não informado'}
                  </b>
                </div>
                {canChangeCard && (
                  <div className="card-change">
                    <button className="btn ghost" type="button" disabled={busy || cardBusy} onClick={changeCard}>
                      {searchParams.get('card_session_id')
                        ? 'Confirmando cartão…'
                        : cardBusy
                          ? 'Abrindo pagamento seguro…'
                          : cardActionLabel}
                    </button>
                    <p>Se a mensalidade não passou, o novo cartão é cobrado na hora.</p>
                  </div>
                )}
                {access?.renewed && (
                  <p className="renewal-flag">
                    Assinatura renovada em <strong>{formatDate(access.renewedAt)}</strong>.
                    {accessActive ? <> Continua ativa até <strong>{accessUntil}</strong>.</> : null}
                  </p>
                )}
                {subscription?.id && (
                  <div className="plan-actions">
                    {canUpgrade && (
                      <button className="btn primary" type="button" disabled={busy} onClick={startUpgrade}>
                        {busy
                          ? 'Preparando upgrade…'
                          : cancelScheduled
                            ? 'Reativar e fazer upgrade para o Plano Prioridade'
                            : 'Fazer upgrade para o Plano Prioridade'}
                      </button>
                    )}
                    {cancelScheduled && (
                      <button className="btn ghost" type="button" disabled={busy} onClick={resumeSubscription}>
                        {busy ? 'Retomando…' : 'Continuar no Plano Basic'}
                      </button>
                    )}
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
                <span>{validityLabel}</span>
                <strong>
                  {isCancelled
                    ? formatDate(subscription?.cancelledAt)
                    : isPix
                      ? formatDateTime(pixExpiresAt)
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
