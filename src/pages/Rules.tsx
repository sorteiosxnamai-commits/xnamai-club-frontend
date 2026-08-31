import { useNavigate } from 'react-router-dom';
import {
  BadgePercent,
  Banknote,
  Gift,
  Package,
  Repeat,
  ShoppingBag,
  Truck,
  UserX,
  XCircle,
} from 'lucide-react';
import { PublicHeader } from '../components/PublicHeader';

const rules = [
  {
    number: '01',
    title: 'Assinatura',
    icon: Repeat,
    items: [
      'A mensalidade do Xnamai Club é de R$ 149,97.',
      'O acesso aos preços exclusivos do Club fica disponível enquanto a assinatura estiver ativa e regular.',
    ],
  },
  {
    number: '02',
    title: 'Preços do Club',
    icon: BadgePercent,
    items: [
      'Os preços exibidos para membros são exclusivos do Xnamai Club.',
      'Os preços podem ser alterados pela Xnamai a qualquer momento, de acordo com estoque, fornecedores e condições de mercado.',
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
    title: 'Cancelamento da assinatura',
    icon: XCircle,
    items: [
      'O cliente pode solicitar o cancelamento da assinatura.',
      'Após o cancelamento, o acesso aos preços exclusivos do Club será encerrado conforme as condições da assinatura.',
      'Pedidos já pagos permanecem sujeitos às condições acordadas no momento da compra.',
    ],
  },
  {
    number: '08',
    title: 'Condição especial de lançamento',
    icon: Gift,
    highlight: true,
    items: [
      'Durante o período promocional de lançamento, a assinatura poderá contar com condições especiais de cashback, conforme divulgado pela Xnamai.',
      'A condição de 100% de cashback sobre a primeira mensalidade é válida somente durante o período informado na campanha.',
      'Após o encerramento da campanha, essa condição não estará mais disponível para novas assinaturas.',
    ],
  },
  {
    number: '09',
    title: 'Clientes não membros',
    icon: UserX,
    items: [
      'Clientes que não possuem uma assinatura ativa não têm acesso aos preços exclusivos do Club.',
      'Caso desejem comprar produtos que estejam com preço de Club, será aplicado o acréscimo definido pela Xnamai para compras de não membros.',
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
        <p className="center-subtitle">Condições de assinatura, preços, pedidos, frete e cancelamento.</p>
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
          <button className="btn primary large" onClick={() => navigate('/planos')}>Assinar o plano de lançamento</button>
        </div>
      </main>
    </>
  );
}
