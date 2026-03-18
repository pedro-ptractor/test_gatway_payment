import { usePlans } from '@/hooks/usePlans';
import { useCreateCheckoutSession } from '@/hooks/useCreateCheckoutSession';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export function Plans() {
  const { data: plans, isLoading, error } = usePlans();
  const createCheckout = useCreateCheckoutSession();

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase() === 'BRL' ? 'BRL' : 'USD',
    }).format(cents / 100);
  };

  if (isLoading) return <p className="text-muted-foreground">Carregando planos...</p>;
  if (error) return <p className="text-destructive">Erro ao carregar planos: {(error as Error).message}</p>;
  if (!plans?.length) return <p className="text-muted-foreground">Nenhum plano disponível.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Planos</h1>
        <p className="text-muted-foreground">Escolha o plano ideal para você.</p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <li key={plan.id}>
            <Card>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                {plan.description && <CardDescription>{plan.description}</CardDescription>}
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {formatPrice(plan.priceCents, plan.currency)}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{plan.interval === 'month' ? 'mês' : 'ano'}
                  </span>
                </p>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button
                  className="w-full"
                  onClick={() => createCheckout.mutate(plan.id)}
                  disabled={createCheckout.isPending}
                >
                  {createCheckout.isPending ? 'Redirecionando...' : 'Assinar'}
                </Button>
                {createCheckout.isError && createCheckout.variables === plan.id && (
                  <p className="w-full text-sm text-destructive">
                    {(createCheckout.error as Error).message}
                  </p>
                )}
              </CardFooter>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
