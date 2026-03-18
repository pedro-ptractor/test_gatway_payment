import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  SidebarProvider,
  SidebarOverlay,
} from '@/components/layout/SidebarProvider';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { MainLayout } from '@/components/layout/MainLayout';
import { Plans } from '@/pages/Plans';
import { CheckoutSuccess } from '@/pages/CheckoutSuccess';
import { CheckoutCancel } from '@/pages/CheckoutCancel';
import { Account } from '@/pages/Account';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { isAuthenticated, fetchMe } from '@/lib/api';
import '@/index.css';

const queryClient = new QueryClient();

function PlansRoute() {
  const token = isAuthenticated();
  const { data: me, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
    enabled: !!token,
  });
  if (token && !isLoading && me?.subscription?.status === 'active') {
    return <Navigate to='/account' replace />;
  }
  return <Plans />;
}

function HomePage() {
  return (
    <div className='space-y-4'>
      <h1 className='text-2xl font-semibold tracking-tight'>Bem-vindo</h1>
      <p className='text-muted-foreground'>
        <Link
          to='/plans'
          className='text-primary underline-offset-4 hover:underline'
        >
          Ver planos
        </Link>
      </p>
    </div>
  );
}

function AppWithSidebar({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultCollapsed={false}>
      <SidebarOverlay />
      <AppSidebar />
      {children}
    </SidebarProvider>
  );
}

function AppRoutes() {
  const [, setToken] = useState(() => isAuthenticated());
  const handleLoginSuccess = useCallback(() => setToken(true), []);

  return (
    <Routes>
      <Route
        path='/login'
        element={<Login onLoginSuccess={handleLoginSuccess} />}
      />
      <Route path='/register' element={<Register />} />
      <Route
        path='/*'
        element={
          <AppWithSidebar>
            <Routes>
              <Route element={<MainLayout />}>
                <Route index element={<HomePage />} />
                <Route path='plans' element={<PlansRoute />} />
                <Route path='account' element={<Account />} />
                <Route path='checkout/success' element={<CheckoutSuccess />} />
                <Route path='checkout/cancel' element={<CheckoutCancel />} />
              </Route>
            </Routes>
          </AppWithSidebar>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
