import { usePageText } from '../content/ContentContext';
import { useEffect } from 'react';
import { Package, Store, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PublicHeader } from '../components/PublicHeader';

export function Home() {
  const t = usePageText('home');
  const navigate = useNavigate();
  useEffect(() => {
    const title = 'Club Xnamai | Seja Sócio e Tenha Acesso a Preços Exclusivos';
    const description = 'Faça parte do Club Xnamai. Tenha acesso a preços exclusivos para sócios, compras flexíveis e vantagens para lojistas e empreendedores.';
    document.title = title;
    const ensure = (selector: string, create: () => HTMLElement) => document.head.querySelector(selector) ?? document.head.appendChild(create());
    const meta = (name: string, content: string, attr: 'name' | 'property' = 'name') => {
      const node = ensure(`meta[${attr}="${name}"]`, () => {
        const element = document.createElement('meta');
        element.setAttribute(attr, name);
        return element;
      });
      node.setAttribute('content', content);
    };
    meta('description', description);
    meta('og:title', title, 'property');
    meta('og:description', description, 'property');
    meta('og:url', 'https://www.clubxnamai.com.br/', 'property');
    meta('og:type', 'website', 'property');
    const canonical = ensure('link[rel="canonical"]', () => {
      const link = document.createElement('link');
      link.rel = 'canonical';
      return link;
    }) as HTMLLinkElement;
    canonical.href = 'https://www.clubxnamai.com.br/';
  }, []);

  return <>
    <PublicHeader />
    <main className="public-page">
      <section className="hero-simple">
        <div className="eyebrow">{t('heroEyebrow', 'CLUBE EXCLUSIVO DE COMPRAS PARA LOJISTAS')}</div>
        <h1>{t('heroTitle', 'Seja sócio da Xnamai.')} <span>{t('heroSubtitle', 'Compre melhor. Economize mais. Cresça junto.')}</span></h1>
        <p>{t('heroLead', 'Faça parte do clube de compras da Xnamai e tenha acesso a preços exclusivos, oportunidades comerciais e condições especiais para o seu negócio.')}</p>
        <div className="hero-buttons">
          <button className="btn primary large" onClick={() => navigate('/planos')}>{t('ctaJoin', 'Quero ser sócio')}</button>
          <button className="btn ghost large" onClick={() => navigate('/regras')}>{t('ctaBenefits', 'Conhecer as vantagens')}</button>
        </div>
      </section>
      <section className="value-grid">
        <div className="value-card"><Package /><strong>{t('cardPriceTitle', 'Quase caixa fechada')}</strong><span>{t('title', 'Preço de quase caixa fechada. Sem precisar comprar caixa fechada.')}</span></div>
        <div className="value-card"><Store /><strong>{t('cardExclusiveTitle', 'Preços exclusivos')}</strong><span>{t('cardExclusive', 'Condições comerciais disponibilizadas aos sócios Xnamai.')}</span></div>
        <div className="value-card"><TrendingUp /><strong>{t('cardQuantityTitle', 'Na quantidade que precisa')}</strong><span>{t('cardQuantity', 'Compre sem a obrigação de caixa fechada, conforme as condições de cada produto.')}</span></div>
      </section>
    </main>
  </>;
}
