import { ArrowRight, BadgePercent, BarChart3, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PublicHeader } from '../components/PublicHeader';

export function Home() {
  const navigate = useNavigate();
  return <>
    <PublicHeader />
    <main className="public-page">
      <section className="hero-simple">
        <div className="eyebrow">CLUBE DE VANTAGENS EMPRESARIAIS</div>
        <h1>Compre melhor. Economize mais. <span>Cresça com o XNaMai Club.</span></h1>
        <p>Assinaturas empresariais com condições comerciais exclusivas, economia estimada e acompanhamento completo da sua assinatura.</p>
        <div className="hero-buttons">
          <button className="btn primary large" onClick={() => navigate('/simulador')}>Simular economia <ArrowRight size={18}/></button>
          <button className="btn ghost large" onClick={() => navigate('/planos')}>Ver planos</button>
        </div>
      </section>
      <section className="value-grid">
        <div className="value-card"><BadgePercent/><strong>15% a 25%</strong><span>Faixa estimada de economia em compras elegíveis.</span></div>
        <div className="value-card"><ShieldCheck/><strong>Assinatura segura</strong><span>Fluxo protegido, autenticação e cobrança tokenizada.</span></div>
        <div className="value-card"><BarChart3/><strong>Visibilidade total</strong><span>Acompanhe plano, cobranças e situação da assinatura.</span></div>
      </section>
    </main>
  </>;
}
