import { useParams } from 'react-router-dom';
import { Home } from './Home';
import { Plans } from './Plans';
import { Rules } from './Rules';
import { Simulator } from './Simulator';
import { AsaasCheckout } from './AsaasCheckout';

export function ContentPreview() {
  const { screen } = useParams();
  if (screen === 'home') return <Home />;
  if (screen === 'plans') return <Plans />;
  if (screen === 'rules') return <Rules />;
  if (screen === 'simulator') return <Simulator />;
  if (screen === 'checkout') return <AsaasCheckout code="LAUNCH" hasSubscription={false} />;
  return <p>Tela indisponível.</p>;
}
