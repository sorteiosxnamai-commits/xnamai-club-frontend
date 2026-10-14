import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { PublicHeader } from '../components/PublicHeader';

export function Confirmation() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const [error, setError] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [ready, setReady] = useState(!sessionId);
  const [waitingPix, setWaitingPix] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    let attempts = 0;
    let timer = 0;

    async function fetchConfirm() {
      try {
        const url = `/subscriptions/confirm?sessionId=${encodeURIComponent(sessionId!)}`;
        const result = await api<{ nextBillingDate?: string | null }>(url);
        if (cancelled) return;
        if (result.nextBillingDate) setValidUntil(result.nextBillingDate);
        sessionStorage.removeItem('selected_plan');
        setWaitingPix(false);
        setReady(true);
      } catch (e) {
        if (cancelled) return;
        const message = (e as Error).message;
        const pending = /ainda não confirmado/i.test(message);
        if (pending && attempts < 40) {
          attempts += 1;
          setWaitingPix(true);
          timer = window.setTimeout(fetchConfirm, 3000);
          return;
        }
        setWaitingPix(false);
        setError(message);
      }
    }

    fetchConfirm();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [sessionId]);

  return (
    <>
      <PublicHeader />
      <main className="confirmation">
        <div className="steps">
          <span className="done">1 Planos ✓</span>
          <span className="done">2 Pré-aprovação ✓</span>
          <span className="done">3 Pagamento ✓</span>
          <span className="active">4 Confirmação</span>
        </div>
        <CheckCircle2 className="success-icon" />
        <h1>{error ? 'Pagamento em conferência' : waitingPix ? 'Aguardando o PIX' : 'Assinatura confirmada!'}</h1>
        <p>
          {error
            ? error
            : waitingPix
              ? 'O PIX já pode ter sido pago. Estamos confirmando com a Stripe para liberar o mês.'
            : ready
              ? sessionStorage.getItem('checkout_method') === 'PIX_RECURRING'
                ? `PIX confirmado. O acesso vale até ${validUntil ? new Date(validUntil).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'o vencimento'} e não renova sozinho.`
                : 'A Stripe autorizou o cartão, gerou o token da recorrência e agendou a próxima cobrança no mesmo dia do mês.'
              : 'Confirmando autorização na Stripe...'}
        </p>
        <div className="confirmation-card">
          <h2>{error ? 'Se o PIX já foi pago, abra sua área. O acesso libera quando a Stripe confirmar.' : waitingPix ? 'Confirmando o pagamento' : 'Pagamento aprovado e assinatura ativa'}</h2>
          <p>Acompanhe plano, cobrança e situação na sua área.</p>
          <button className="btn primary large" onClick={() => nav('/app')} disabled={!ready && !error}>
            Ir para minha assinatura
          </button>
        </div>
      </main>
    </>
  );
}
