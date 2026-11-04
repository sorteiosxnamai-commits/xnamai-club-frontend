import { usePageText } from '../content/ContentContext';
import { ArrowRight, BadgePercent, BarChart3, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PublicHeader } from '../components/PublicHeader';

export function Home() {
  const t = usePageText('home');
  const navigate = useNavigate();
  return <>
    <PublicHeader />
    <main className="public-page">
      <section className="hero-simple">
        <div className="eyebrow">{t("eyebrow", "CLUBE DE VANTAGENS EMPRESARIAIS")}</div>
        <h1>{t("intro", "Compre melhor. Economize mais. ")}<span>{t("title", "Cresça com o XNaMai Club.")}</span></h1>
        <p>{t("description", "Assinaturas empresariais com condições comerciais exclusivas, economia estimada e acompanhamento completo da sua assinatura.")}</p>
        <div className="hero-buttons">
          <button className="btn primary large" onClick={() => navigate('/simulador')}>{t("simulate", "Simular economia ")}<ArrowRight size={18}/></button>
          <button className="btn ghost large" onClick={() => navigate('/planos')}>{t("plans", "Ver plano")}</button>
        </div>
      </section>
      <section className="value-grid">
        <div className="value-card"><BadgePercent/><strong>15% a 25%</strong><span>{t("saving", "Faixa estimada de economia em compras elegíveis.")}</span></div>
        <div className="value-card"><ShieldCheck/><strong>{t("secureTitle", "Assinatura segura")}</strong><span>{t("secure", "Fluxo protegido, autenticação e cobrança tokenizada.")}</span></div>
        <div className="value-card"><BarChart3/><strong>{t("visibilityTitle", "Visibilidade total")}</strong><span>{t("visibility", "Acompanhe plano, cobranças e situação da assinatura.")}</span></div>
      </section>
    </main>
  </>;
}
