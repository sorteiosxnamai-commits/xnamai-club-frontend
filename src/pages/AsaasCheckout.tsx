import { usePageText } from '../content/ContentContext';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, QrCode } from 'lucide-react';
import { asaasOffer } from '../asaas';
import { api, money } from '../api/client';
import { PublicHeader } from '../components/PublicHeader';

export function AsaasCheckout({ code, hasSubscription }: { code: string; hasSubscription: boolean }) {
  const t = usePageText('checkout');
  const [pix, setPix] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const offer = asaasOffer(code);
  async function pay(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try {
      const result = await api<{ url: string }>('/subscriptions/payment-link', { method: 'POST', body: JSON.stringify({ code, method: pix ? 'PIX' : 'CREDIT_CARD' }) });
      // Only navigate to one of the business-supplied destinations for this plan.
      if (result.url !== offer?.pixUrl && result.url !== offer?.cardUrl) throw new Error('Link de pagamento inválido.');
      window.location.assign(result.url);
    } catch (error) { setError((error as Error).message); setBusy(false); }
  }
  return <>
    <PublicHeader />
    <main className="checkout-page">
      <h1>{t("title", "Assinatura empresarial pelo Asaas")}</h1>
      {!offer ? <div className="error-box" role="alert">Plano indisponível. <Link to="/planos">Escolha um plano.</Link></div>
        : hasSubscription ? <div className="panel">
          <h2>Você já possui uma assinatura em andamento</h2>
          <p>Para mudar o pagamento para o Asaas, fale com o atendimento e confirme a transição da assinatura atual antes de pagar novamente.</p>
          <Link className="btn primary" to="/app">Minha assinatura</Link>
        </div> : <section className="panel">
          <h2>{offer.name}</h2>
          <p>Valor original: <span className="price-was">{money(offer.original)}/mês</span></p>
          <p>{t("eligibility", "Oferta de lançamento exclusiva para lojistas com cadastro CNPJ.")}</p>
          <button type="button" aria-pressed={!pix} className={`payment-option ${!pix ? 'selected' : ''}`} onClick={() => setPix(false)}>
            <CreditCard /><span><b>Cartão de crédito — {money(offer.card)}/mês</b><small>{t("cardCondition", "Selecione a recorrência no aplicativo ou site para obter o valor de lançamento.")}</small></span>
          </button>
          <button type="button" aria-pressed={pix} className={`payment-option ${pix ? 'selected' : ''}`} onClick={() => setPix(true)}>
            <QrCode /><span><b>PIX — {money(offer.pix)}/mês</b><small>{t("pixCondition", "Pagamento mensal no período de lançamento.")}</small></span>
          </button>
          <p><strong>Total: {money(pix ? offer.pix : offer.card)}/mês</strong></p>
          <p>{t("instructions", "Você concluirá o pagamento no Asaas. Confira o plano, o valor e as condições antes de pagar.")}</p>
          <p>{t("confirmation", "A confirmação da assinatura no portal depende da conferência pelo atendimento. Use o mesmo CNPJ e e-mail do cadastro.")}</p>
          {code === 'PRIORITY' && <p>A consulta reserva uma vaga por 32 minutos. A liberação definitiva depende da conferência pelo atendimento.</p>}
          {error && <div className="error-box" role="alert">{error}</div>}
          <a className="btn primary large" aria-disabled={busy} onClick={pay} href={pix ? offer.pixUrl : offer.cardUrl}>{busy ? 'Conferindo disponibilidade…' : `Pagar com ${pix ? 'PIX' : 'cartão'} no Asaas`}</a>
        </section>}
    </main>
  </>;
}
