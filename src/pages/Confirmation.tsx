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
  const [ready, setReady] = useState(!sessionId);

  useEffect(() => {
    if (!sessionId) return;

    async function fetchConfirm() {
      try {
        const url = `/subscriptions/confirm?sessionId=${encodeURIComponent(sessionId!)}`;
        await api(url);
        sessionStorage.removeItem('selected_plan');
        setReady(true);
      } catch (e) {
        setError((e as Error).message);
      }
    }

    fetchConfirm();
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
        <h1>{error ? 'Pagamento em conferência' : 'Assinatura confirmada!'}</h1>
        <p>
          {error
            ? error
            : ready
              ? 'A Stripe autorizou o cartão, gerou o token da recorrência e agendou a próxima cobrança no mesmo dia do mês.'
              : 'Confirmando autorização na Stripe...'}
        </p>
        <div className="confirmation-card">
          <h2>{error ? 'Se o pagamento passou na Stripe, aguarde o webhook' : 'Pagamento aprovado e assinatura ativa'}</h2>
          <p>Acompanhe plano, cobrança e situação na sua área.</p>
          <button className="btn primary large" onClick={() => nav('/app')} disabled={!ready && !error}>
            Ir para minha assinatura
          </button>
        </div>
      </main>
    </>
  );
}
