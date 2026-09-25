import { useNavigate } from 'react-router-dom';
import {
  BadgePercent,
  Banknote,
  FlaskConical,
  Package,
  Repeat,
  ShoppingBag,
  Truck,
  UserX,
  XCircle,
  Zap,
} from 'lucide-react';
import { PublicHeader } from '../components/PublicHeader';

const rules = [
  {
    number: '01',
    title: 'Assinatura',
    icon: Repeat,
    items: [
      'O XNaMai Club possui planos de assinatura com benefícios e valores distintos, conforme o plano escolhido pelo cliente.',
      'Plano Basic: R$ 149,97/mês.',
      'Plano Prioridade: R$ 297,97/mês.',
      'O acesso aos benefícios de cada plano permanece disponível enquanto a assinatura estiver ativa e regular.',
    ],
  },
  {
    number: '02',
    title: 'Preços do Club',
    icon: BadgePercent,
    items: [
      'Os preços exibidos para membros são exclusivos do XNaMai Club.',
      'Os preços podem ser alterados pela XNaMai a qualquer momento, de acordo com estoque, fornecedores e condições de mercado.',
      'Os preços do Club não são cumulativos com outros descontos, cupons ou condições comerciais, salvo quando expressamente informado.',
    ],
  },
  {
    number: '03',
    title: 'Pagamento dos pedidos',
    icon: Banknote,
    items: [
      'As compras realizadas com preço de Club devem ser pagas à vista.',
      'O pedido somente será separado e liberado para envio após a confirmação do pagamento.',
    ],
  },
  {
    number: '04',
    title: 'Pedido mínimo',
    icon: ShoppingBag,
    items: ['O pedido mínimo para compras com preço de Club é de R$ 800,00.'],
  },
  {
    number: '05',
    title: 'Frete e envio — FOB',
    icon: Truck,
    items: [
      'As vendas são realizadas na modalidade FOB.',
      'O custo do transporte é de responsabilidade do cliente.',
      'Quando o envio for realizado por ônibus, a Xnamai entrega a mercadoria sem custo até o ponto de despacho no Brás.',
      'Após o despacho ou a coleta pela transportadora, o transporte e seus respectivos custos ficam sob responsabilidade do cliente.',
    ],
    chips: ['Ônibus', 'Coleta pela transportadora indicada pelo cliente', 'Correios'],
  },
  {
    number: '06',
    title: 'Estoque',
    icon: Package,
    items: [
      'Todos os produtos estão sujeitos à disponibilidade de estoque.',
      'A simples visualização ou inclusão do produto no carrinho não garante sua reserva.',
      'A reserva ocorre após a confirmação do pagamento.',
    ],
  },
  {
    number: '07',
    title: 'Plano Prioridade',
    icon: Zap,
    highlight: true,
    items: [
      'O Plano Prioridade possui mensalidade de R$ 297,97 e é limitado a 50 clientes ativos.',
      'A limitação de 50 clientes preserva a capacidade operacional necessária para oferecer prioridade nos pedidos.',
      'O plano inclui todos os benefícios do Plano Basic, além do Fast Pass e do acesso ao XNaMai Lab.',
      'Fast Pass: separação e envio no mesmo dia para pedidos finalizados com antecedência mínima de 6 horas, respeitando o horário de funcionamento e os horários-limite de operação da XNaMai.',
      'O Fast Pass dá prioridade à separação e ao processamento do pedido. O prazo e a modalidade de transporte continuam sujeitos às condições de envio escolhidas pelo cliente.',
    ],
  },
  {
    number: '08',
    title: 'XNaMai Lab',
    icon: FlaskConical,
    items: [
      'O XNaMai Lab é um grupo exclusivo para clientes do Plano Prioridade, limitado a 50 membros.',
      'Os participantes poderão receber catálogos de novos produtos, indicar produtos de interesse e participar da identificação de demanda por novos produtos.',
      'As indicações poderão ser consideradas pela XNaMai na definição de produtos a serem disponibilizados no site.',
      'A participação no XNaMai Lab não garante a aquisição, disponibilidade ou inclusão de determinado produto no catálogo.',
    ],
  },
  {
    number: '09',
    title: 'Cancelamento da assinatura',
    icon: XCircle,
    items: [
      'O cliente pode solicitar o cancelamento da assinatura.',
      'Após o cancelamento, o acesso aos benefícios do plano será encerrado conforme as condições da assinatura.',
      'Pedidos já pagos permanecem sujeitos às condições acordadas no momento da compra.',
    ],
  },
  {
    number: '10',
    title: 'Clientes não membros',
    icon: UserX,
    items: [
      'Clientes que não possuem uma assinatura ativa não têm acesso aos preços exclusivos do Club.',
      'Caso desejem comprar produtos que estejam com preço de Club, será aplicado o acréscimo definido pela XNaMai para compras de não membros.',
    ],
  },
];

export function Rules() {
  const navigate = useNavigate();
  return (
    <>
      <PublicHeader />
      <main className="public-page rules-page">
        <div className="eyebrow">REGRAS DO XNAMAI CLUB</div>
        <h1 className="center-title"><span>Regras</span> do clube</h1>
        <p className="center-subtitle">O XNaMai Club possui dois planos: Basic e Prioridade.</p>
        <section className="rules-fastpass" aria-label="Comparativo de antecedência dos planos">
          <div><span>BASIC</span><strong>24H</strong><small>antecedência mínima</small></div>
          <div><span>PRIORIDADE</span><strong>6H</strong><small>antecedência mínima</small></div>
          <p>O Plano Prioridade é limitado a <strong>50 clientes</strong> para preservar a capacidade operacional de atendimento e separação prioritária.</p>
        </section>
        <ol className="rules-list">
          {rules.map((rule) => {
            const Icon = rule.icon;
            return (
              <li className={`rules-card${rule.highlight ? ' highlight' : ''}`} key={rule.number}>
                <header>
                  <span className="rules-number">{rule.number}</span>
                  <Icon />
                  <h2>{rule.title}</h2>
                </header>
                <ul>
                  {rule.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
                {rule.chips && (
                  <div className="rules-chips">
                    {rule.chips.map((chip) => <span key={chip}>{chip}</span>)}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
        <div className="rules-cta">
          <button className="btn primary large" onClick={() => navigate('/planos')}>Conhecer os planos</button>
        </div>
      </main>
    </>
  );
}
