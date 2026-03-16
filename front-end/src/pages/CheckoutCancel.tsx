import { Link } from 'react-router-dom';

export function CheckoutCancel() {
  return (
    <div style={{ padding: 24, textAlign: 'center', maxWidth: 400, margin: '0 auto' }}>
      <h1>Checkout cancelado</h1>
      <p>Você cancelou o processo de pagamento.</p>
      <Link to="/plans">Voltar aos planos</Link>
    </div>
  );
}
