import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  confirmCheckoutSession,
  createBillingPortalSession,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const REDIRECT_DELAY_MS = 2000;

export function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'confirmed' | 'pending' | 'error'>(
    () => (!sessionId ? 'error' : 'loading'),
  );

  useEffect(() => {
    const sid = sessionId;
    if (!sid) return;

    let cancelled = false;

    async function confirm(sessionIdParam: string) {
      try {
        const res = await confirmCheckoutSession(sessionIdParam);
        if (cancelled) return;
        if (res.status === 'active' && res.subscriptionId) {
          setStatus('confirmed');
          setTimeout(() => navigate('/account', { replace: true }), REDIRECT_DELAY_MS);
        } else {
          setStatus('pending');
        }
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    confirm(sid);
    return () => {
      cancelled = true;
    };
  }, [sessionId, navigate]);

  async function handleConfigureSubscription() {
    try {
      const url = await createBillingPortalSession();
      window.location.href = url;
    } catch (err) {
      console.error(err);
    }
  }

  if (status === 'error') {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Sessão inválida</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Não foi possível confirmar a assinatura. Verifique o link ou tente novamente.
          </p>
          <Button type="button" variant="outline" onClick={() => navigate('/plans')}>
            Voltar aos planos
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (status === 'confirmed') {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Assinatura ativa</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Redirecionando para sua conta...</p>
        </CardContent>
      </Card>
    );
  }

  if (status === 'pending') {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Pagamento recebido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Verificando assinatura...</p>
          <p className="text-sm text-muted-foreground">
            Sua assinatura será ativada em instantes. Você pode fechar esta página ou aguardar.
          </p>
          <Button type="button" variant="outline" onClick={handleConfigureSubscription}>
            Configurar assinatura
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Verificando assinatura...</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Aguarde enquanto confirmamos seu pagamento.</p>
      </CardContent>
    </Card>
  );
}
