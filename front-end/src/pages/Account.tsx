import { useQuery } from '@tanstack/react-query';
import { fetchMe, createBillingPortalSession } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const SUBSCRIPTION_STATUS_LABEL: Record<string, string> = {
  active: 'Ativo',
  past_due: 'Pagamento pendente',
  canceled: 'Cancelado',
  incomplete: 'Incompleto',
  incomplete_expired: 'Expirado',
  trialing: 'Período de teste',
};

export function Account() {
  const { data: me, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
  });

  async function handleManageInStripe() {
    try {
      const url = await createBillingPortalSession();
      window.location.href = url;
    } catch (err) {
      console.error(err);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl py-6">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="mx-auto max-w-2xl py-6">
        <p className="text-muted-foreground">Não foi possível carregar os dados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Minha conta</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acesso liberado ao conteúdo da sua assinatura.
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Dados do usuário</h2>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm">
              <strong>Nome:</strong> {me.name}
            </p>
            <p className="mt-2 text-sm">
              <strong>E-mail:</strong> {me.email}
            </p>
            {me.subscription && (
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <strong>Assinatura:</strong>
                <span className="inline-block rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                  {me.subscription.plan.name}
                </span>
                <span
                  className={cn(
                    'inline-block rounded-md px-2 py-0.5 text-xs font-medium',
                    me.subscription.status === 'active' && 'bg-green-100 text-green-800',
                    me.subscription.status === 'past_due' && 'bg-red-100 text-red-800',
                    me.subscription.status !== 'active' &&
                      me.subscription.status !== 'past_due' &&
                      'bg-muted text-muted-foreground'
                  )}
                >
                  {SUBSCRIPTION_STATUS_LABEL[me.subscription.status] ?? me.subscription.status}
                </span>
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {me.subscription && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Pagamento</h2>
          <Card className="border-gray-700 bg-gray-800">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 space-y-0 p-6">
              <div>
                <CardTitle className="text-base text-white">Payment</CardTitle>
                <p className="mt-1 text-sm text-gray-400">Update your payment details</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-gray-500 text-white hover:bg-gray-700 hover:text-white"
                onClick={handleManageInStripe}
              >
                Manage in Stripe
              </Button>
            </CardHeader>
          </Card>
        </section>
      )}
    </div>
  );
}
