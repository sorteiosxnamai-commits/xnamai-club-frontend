import { useMemo, useState } from 'react';
import { CheckCircle2, CreditCard, QrCode, ShieldCheck } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api, money } from '../api/client';
import { PublicHeader } from '../components/PublicHeader';
import { Plan } from './Plans';

export function Checkout() {
  const navigate = useNavigate();
  const plan = useMemo(() => { try { return JSON.parse(sessionStorage.getItem('selected_plan') || '') as Plan; } catch { return null; } }, []);
  const [method, setMethod] = useState<'CREDIT_CARD' | 'PIX_RECURRING'>('CREDIT_CARD');
  const [step, setStep] = useState<2|3>(2);
  const [card, setCard] = useState({ name:'', number:'', expiry:'', cvv:'' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (!plan) return <Navigate to="/planos" replace/>;
  const selectedPlan = plan;

  async function finish() {
    setBusy(true); setError('');
    try {
      const digits = card.number.replace(/\D/g,'');
      const last4 = method === 'CREDIT_CARD' ? (digits.slice(-4) || '4242') : undefined;
      await api('/subscriptions', { method:'POST', body: JSON.stringify({ planId: selectedPlan.id, paymentMethodType: method, paymentToken: `pm_demo_${Date.now()}`, cardBrand: method === 'CREDIT_CARD' ? 'Visa' : undefined, cardLastFour: last4 }) });
      sessionStorage.removeItem('selected_plan');
      navigate('/confirmacao');
    } catch(e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  return <><PublicHeader/><main className="checkout-page"><div className="steps"><span className="done">1 Planos ✓</span><span className={step===2?'active':''}>2 Pré-aprovação</span><span className={step===3?'active':''}>3 Pagamento</span><span>4 Confirmação</span></div><h1>{step===2?'Pré-aprovação da assinatura':'Pagamento da assinatura'}</h1><p>{step===2?'Escolha como deseja pagar sua assinatura do XNaMai Club.':'Cadastre os dados para concluir a assinatura.'}</p><section className="checkout-grid"><aside className="panel plan-summary"><div className="diamond-mark">◇</div><h2>{plan.name}</h2><div className="checkout-price">{money(plan.monthlyPriceCents)}<small>/mês</small></div><p>{plan.description}</p><ul><li>✓ Preços diferenciados</li><li>✓ Acesso ao XNaMai Club</li><li>✓ Ofertas exclusivas</li></ul></aside><div className="panel checkout-main">{step===2 ? <><h2>Escolha a forma de pagamento</h2><button className={`payment-option ${method==='CREDIT_CARD'?'selected':''}`} onClick={()=>setMethod('CREDIT_CARD')}><CreditCard/><span><b>Cartão de crédito</b><small>Cobrança mensal automática.</small></span></button><button className={`payment-option ${method==='PIX_RECURRING'?'selected':''}`} onClick={()=>setMethod('PIX_RECURRING')}><QrCode/><span><b>PIX recorrente</b><small>Renovação mensal via PIX recorrente.</small></span></button><div className="secure-note"><ShieldCheck/> A assinatura será ativada após a confirmação do pagamento.</div><button className="btn primary large full" onClick={()=>setStep(3)}>Continuar</button></> : <><h2>Dados de pagamento</h2><div className="method-tabs"><button className={method==='CREDIT_CARD'?'active':''} onClick={()=>setMethod('CREDIT_CARD')}><CreditCard/> Cartão</button><button className={method==='PIX_RECURRING'?'active':''} onClick={()=>setMethod('PIX_RECURRING')}><QrCode/> PIX recorrente</button></div>{method==='CREDIT_CARD' ? <div className="payment-form"><label>Nome no cartão<input value={card.name} onChange={e=>setCard({...card,name:e.target.value})}/></label><label>Número do cartão<input placeholder="4242 4242 4242 4242" value={card.number} onChange={e=>setCard({...card,number:e.target.value})}/></label><div className="two-cols"><label>Validade<input placeholder="MM/AA" value={card.expiry} onChange={e=>setCard({...card,expiry:e.target.value})}/></label><label>CVV<input placeholder="123" value={card.cvv} onChange={e=>setCard({...card,cvv:e.target.value})}/></label></div><p className="security-copy">Protótipo: esses campos não são enviados ao backend. Em produção devem ser substituídos pelos Hosted Fields/SDK do gateway; somente o token será enviado.</p></div> : <div className="pix-box"><QrCode size={48}/><h3>PIX recorrente</h3><p>O gateway real deverá gerar a autorização do PIX Automático. Neste protótipo a assinatura é simulada.</p></div>}{error && <div className="error-box">{error}</div>}<div className="checkout-actions"><button className="btn ghost" onClick={()=>setStep(2)}>Voltar</button><button className="btn primary large" onClick={finish} disabled={busy}>{busy?'Processando...':'Revisar e finalizar'}</button></div></>}</div><aside className="panel order-summary"><h2>Resumo da assinatura</h2><div><span>Plano</span><b>{plan.name}</b></div><div><span>Mensalidade</span><b>{money(plan.monthlyPriceCents)}</b></div><div><span>Forma</span><b>{method==='CREDIT_CARD'?'Cartão':'PIX recorrente'}</b></div><hr/><div className="total"><span>Total mensal</span><b>{money(plan.monthlyPriceCents)}</b></div><div className="secure-note"><ShieldCheck/> Ambiente protegido</div></aside></section></main></>;
}
