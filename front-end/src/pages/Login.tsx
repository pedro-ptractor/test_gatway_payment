import { LoginForm } from '@/components/auth/LoginForm';

type LoginProps = {
  onLoginSuccess?: () => void;
};

export function Login({ onLoginSuccess }: LoginProps) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <div className="grid gap-6 md:grid-cols-2 md:gap-12">
          <div className="flex flex-col justify-center">
            <LoginForm onLoginSuccess={onLoginSuccess} />
          </div>
          <div className="relative hidden overflow-hidden rounded-xl bg-muted md:block">
            <div
              className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent"
              aria-hidden
            />
            <div className="relative flex h-full min-h-[320px] items-center justify-center p-8">
              <p className="text-center text-sm font-medium text-muted-foreground">
                Conteúdo da sua assinatura em um só lugar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
