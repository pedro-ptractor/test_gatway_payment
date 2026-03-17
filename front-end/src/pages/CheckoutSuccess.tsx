import { createBillingPortalSession } from '../lib/api';

export function CheckoutSuccess() {
  async function handleConfigureSubscription() {
    const url = await createBillingPortalSession();
    window.location.href = url;
  }

  return (
    <div
      style={{
        padding: 24,
        textAlign: 'center',
        maxWidth: 400,
        margin: '0 auto',
      }}
    >
      <h1>Pagamento recebido</h1>
      <p>Verificando assinatura...</p>
      <p style={{ color: '#666', fontSize: 14 }}>
        Sua assinatura será ativada em instantes. Você pode fechar esta página.
      </p>
      <button onClick={handleConfigureSubscription}>
        configurar assinatura
      </button>
    </div>
  );
}
