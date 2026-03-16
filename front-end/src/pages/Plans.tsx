import { usePlans } from '../hooks/usePlans';
import { useCreateCheckoutSession } from '../hooks/useCreateCheckoutSession';

export function Plans() {
  const { data: plans, isLoading, error } = usePlans();
  const createCheckout = useCreateCheckoutSession();

  if (isLoading) return <p>Carregando planos...</p>;
  if (error) return <p>Erro ao carregar planos: {(error as Error).message}</p>;
  if (!plans?.length) return <p>Nenhum plano disponível.</p>;

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase() === 'BRL' ? 'BRL' : 'USD',
    }).format(cents / 100);
  };

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <h1>Planos</h1>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {plans.map((plan) => (
          <li
            key={plan.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: 8,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <strong>{plan.name}</strong>
            {plan.description && <p style={{ margin: '8px 0', color: '#666' }}>{plan.description}</p>}
            <p>
              {formatPrice(plan.priceCents, plan.currency)} / {plan.interval === 'month' ? 'mês' : 'ano'}
            </p>
            <button
              type="button"
              onClick={() => createCheckout.mutate(plan.id)}
              disabled={createCheckout.isPending}
            >
              {createCheckout.isPending ? 'Redirecionando...' : 'Assinar'}
            </button>
            {createCheckout.isError && createCheckout.variables === plan.id && (
              <p style={{ color: 'red', fontSize: 14 }}>{(createCheckout.error as Error).message}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
