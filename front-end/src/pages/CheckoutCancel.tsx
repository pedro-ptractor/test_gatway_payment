import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function CheckoutCancel() {
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Checkout cancelado</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">Você cancelou o processo de pagamento.</p>
        <Button asChild variant="outline">
          <Link to="/plans">Voltar aos planos</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
