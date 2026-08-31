import { useMemo, useState } from 'react';
import { BarChart3, Calculator, Headphones, Percent, Star } from 'lucide-react';
import { PublicHeader } from '../components/PublicHeader';

const brl = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export function Simulator() {
  const [spend, setSpend] = useState(55000);
  const calc = useMemo(() => ({ min: spend * .15, avg: spend * .20, max: spend * .25 }), [spend]);
  const recommended = 'Plano Lançamento';
  return <>
    <PublicHeader />
    <main className="public-page simulator-page">
      <section className="sim-heading">
        <div className="sim-icon"><Calculator/></div>
        <div><div className="eyebrow">XNaMai Club › Simulador de economia</div><h1>Descubra quanto sua empresa<br/>pode economizar com o XNaMai Club</h1><p>Faixa média estimada entre 15% e 25% em compras elegíveis.</p></div>
      </section>
      <section className="sim-layout">
        <div className="panel sim-input">
          <h2>Simule sua economia mensal</h2>
          <label>Quanto sua empresa gasta por mês em compras?</label>
          <div className="money-input">{brl(spend)}</div>
          <input type="range" min="1000" max="500000" step="1000" value={spend} onChange={e => setSpend(Number(e.target.value))}/>
          <div className="slider-labels"><span>R$ 1 mil</span><span>R$ 100 mil</span><span>R$ 250 mil</span><span>R$ 500 mil</span></div>
          <div className="info-line">Faixa estimada de economia do Club: <strong>15% a 25%</strong></div>
          <button className="btn primary large full">Calcular economia</button>
          <div className="recommended-plan"><Star/><div><small>Plano recomendado</small><strong>{recommended}</strong></div></div>
        </div>
        <div className="panel sim-result">
          <div className="result-title">Você pode economizar entre</div>
          <div className="result-range">{brl(calc.min)} <small>e</small> {brl(calc.max)}</div>
          <div className="result-month">por mês</div>
          <div className="avg-box"><span>Economia média estimada</span><strong>{brl(calc.avg)}<small>/mês</small></strong></div>
          <div className="saving-cards">
            <div><Percent/><span>Economia mínima</span><strong>{brl(calc.min)}/mês</strong><small>15%</small></div>
            <div className="active-saving"><Star/><span>Economia média</span><strong>{brl(calc.avg)}/mês</strong><small>20%</small></div>
            <div><BarChart3/><span>Economia máxima</span><strong>{brl(calc.max)}/mês</strong><small>25%</small></div>
          </div>
          <div className="annual-grid"><div><span>Anual mínima</span><strong>{brl(calc.min*12)}</strong></div><div><span>Anual média</span><strong>{brl(calc.avg*12)}</strong></div><div><span>Anual máxima</span><strong>{brl(calc.max*12)}</strong></div></div>
        </div>
      </section>
      <section className="benefit-strip"><div><Percent/><span><b>Condições exclusivas</b>Preços negociados para membros.</span></div><div><Star/><span><b>Plano recomendado</b>{recommended} para o valor informado.</span></div><div><Headphones/><span><b>Suporte especializado</b>Atendimento dedicado.</span></div><div><BarChart3/><span><b>Mais margem</b>Transforme economia em resultado.</span></div></section>
    </main>
  </>;
}
