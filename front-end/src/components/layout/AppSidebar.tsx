import { Link, useLocation } from 'react-router-dom';
import { Home, CreditCard } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/layout/SidebarProvider';
import { AppLogo } from '@/components/layout/AppLogo';
import { NavUser } from '@/components/layout/NavUser';
import { Separator } from '@/components/ui/separator';
import { fetchMe, isAuthenticated, logout } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

const navItems = [
  { to: '/', label: 'Início', icon: Home },
  { to: '/plans', label: 'Planos', icon: CreditCard },
];

export function AppSidebar() {
  const { collapsed, open } = useSidebar();
  const location = useLocation();
  const queryClient = useQueryClient();
  const token = isAuthenticated();
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
    enabled: !!token,
  });

  const showPlansLink = !token || me?.subscription?.status !== 'active';
  const filteredNavItems = showPlansLink
    ? navItems
    : navItems.filter((item) => item.to !== '/plans');

  const handleLogout = () => {
    logout();
    queryClient.removeQueries({ queryKey: ['me'] });
  };

  return (
    <aside
      className={cn(
        'flex h-svh flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-linear',
        'fixed inset-y-0 left-0 z-40 md:sticky',
        'max-md:translate-x-0 max-md:transition-transform duration-200',
        !open && 'max-md:-translate-x-full',
        collapsed
          ? 'w-[var(--sidebar-width-collapsed)]'
          : 'w-[var(--sidebar-width)]',
      )}
    >
      <div className='flex h-14 shrink-0 items-center border-b border-sidebar-border px-2'>
        <AppLogo collapsed={collapsed} />
      </div>
      <nav className='flex flex-1 flex-col gap-1 overflow-auto p-2'>
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium no-underline transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                collapsed && 'justify-center px-0',
              )}
            >
              <Icon className='h-4 w-4 shrink-0' />
              {!collapsed && <span className='truncate'>{item.label}</span>}
            </Link>
          );
        })}
        {token && (
          <>
            <Separator className='my-2' />
            <Link
              to='/account'
              className={cn(
                'flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium no-underline transition-colors',
                location.pathname === '/account'
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                collapsed && 'justify-center px-0',
              )}
            >
              <CreditCard className='h-4 w-4 shrink-0' />
              {!collapsed && <span className='truncate'>Conta</span>}
            </Link>
          </>
        )}
      </nav>
      <div className='border-t border-sidebar-border p-2'>
        <NavUser
          me={me ?? null}
          collapsed={collapsed}
          onLogout={handleLogout}
        />
      </div>
    </aside>
  );
}
