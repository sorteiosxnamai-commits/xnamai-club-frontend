import { usePageText } from '../content/ContentContext';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Barcode, CreditCard, QrCode } from 'lucide-react';
import { asaasOffer } from '../asaas';
import { api, money } from '../api/client';
import { PublicHeader } from '../components/PublicHeader';

export function AsaasCheckout({ code, hasSubscription, upgrading = false }: { code: string; hasSubscription: boolean; upgrading?: boolean }) {
  const t = usePageText('checkout');
  const [method, setMethod] = useState<'CREDIT_CARD' | 'BOLETO' | 'PIX'>(() => (
    sessionStorage.getItem('checkout_method') === 'PIX_RECURRING' ? 'PIX' : 'CREDIT_CARD'
  ));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const offer = asaasOffer(code);
  const href = offer ? method === 'CREDIT_CARD' ? offer.cardUrl : method === 'BOLETO' ? offer.boletoUrl : offer.pixUrl : '';
  const payLabel = method === 'CREDIT_CARD' ? 'cartão' : method === 'BOLETO' ? 'boleto' : 'PIX';
  async function pay(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (busy || !offer) return;
    setBusy(true); setError('');
    try {
      const result = await api<{ url: string }>('/subscriptions/payment-link', { method: 'POST', body: JSON.stringify({ code, method }) });
      const allowed = [offer.cardUrl, offer.boletoUrl, offer.pixUrl];
      if (!allowed.includes(result.url)) throw new Error('Link de pagamento inválido.');
      window.location.assign(result.url);
    } catch (error) { setError((error as Error).message); setBusy(false); }
  }
  return <>
    <PublicHeader />
    <main className="checkout-page">
      <h1>{t("joinTitle", "Você está a um passo de ser sócio Xnamai")}</h1>
      {!offer ? <div className="error-box" role="alert">Plano indisponível. <Link to="/planos">Escolha uma categoria.</Link></div>
        : hasSubscription ? <div className="panel">
          <h2>Você já possui uma participação em andamento</h2>
          <p>Para mudar o pagamento para o Asaas, fale com o atendimento e confirme a transição da participação atual antes de pagar novamente.</p>
          <Link className="btn primary" to="/app">Área do sócio</Link>
        </div> : <section className="panel">
          <h2>{upgrading ? 'Upgrade para Sócio Xnamai Prime' : offer.name}</h2>
          {upgrading && <p>A categoria Sócio Xnamai continua até o vencimento. Este pagamento inicia o Sócio Xnamai Prime.</p>}
          <p>Mensalidade recorrente da categoria escolhida. A renovação segue a forma de pagamento confirmada no Asaas. O cancelamento pode ser pedido na área do sócio.</p>
          <p>Valor original: <span className="price-was">{money(offer.original)}/mês</span></p>
          <p>{t("eligibility", "Oferta de lançamento exclusiva para lojistas com cadastro CNPJ.")}</p>
          <button type="button" aria-pressed={method === 'CREDIT_CARD'} className={`payment-option ${method === 'CREDIT_CARD' ? 'selected' : ''}`} onClick={() => setMethod('CREDIT_CARD')}>
            <CreditCard /><span><b>Cartão de crédito — {money(offer.card)}/mês</b><small>{t("cardCondition", "Selecione a recorrência no aplicativo ou site para obter o valor de lançamento.")}</small></span>
          </button>
          <button type="button" aria-pressed={method === 'BOLETO'} className={`payment-option ${method === 'BOLETO' ? 'selected' : ''}`} onClick={() => setMethod('BOLETO')}>
            <Barcode /><span><b>Boleto — {money(offer.boleto)}/mês</b><small>Mensalidade avulsa no boleto, no período de lançamento.</small></span>
          </button>
          <button type="button" aria-pressed={method === 'PIX'} className={`payment-option ${method === 'PIX' ? 'selected' : ''}`} onClick={() => setMethod('PIX')}>
            <QrCode /><span><b>PIX — {money(offer.pix)}/mês</b><small>{t("pixCondition", "Pagamento mensal no período de lançamento.")}</small></span>
          </button>
          <p><strong>Total: {money(method === 'CREDIT_CARD' ? offer.card : method === 'BOLETO' ? offer.boleto : offer.pix)}/mês</strong></p>
          <p>{t("instructions", "Você concluirá o pagamento no Asaas. Confira o plano, o valor e as condições antes de pagar.")}</p>
          <p>{t("confirmation", "A confirmação da assinatura no portal depende da conferência pelo atendimento. Use o mesmo CNPJ e e-mail do cadastro.")}</p>
          {code === 'PRIORITY' && <p>A consulta reserva uma vaga por 32 minutos. A liberação definitiva depende da conferência pelo atendimento.</p>}
          {error && <div className="error-box" role="alert">{error}</div>}
          <a className="btn primary large" aria-disabled={busy} onClick={pay} href={href}>{busy ? 'Conferindo disponibilidade…' : `Confirmar adesão com ${payLabel} no Asaas`}</a>
        </section>}
    </main>
  </>;
}
