import { Link, useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MeResponse } from '@/lib/api';

type NavUserProps = {
  me: MeResponse | null;
  collapsed?: boolean;
  onLogout?: () => void;
};

export function NavUser({ me, collapsed, onLogout }: NavUserProps) {
  const navigate = useNavigate();

  if (!me) {
    return (
      <Link
        to="/login"
        className={cn(
          'flex items-center gap-2 rounded-lg px-2 py-2 text-sidebar-foreground no-underline hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors',
          collapsed && 'justify-center px-0'
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
          <User className="h-4 w-4" />
        </div>
        {!collapsed && <span className="truncate text-sm font-medium">Entrar</span>}
      </Link>
    );
  }

  return (
    <div className={cn('flex flex-col gap-1', collapsed ? 'items-center' : '')}>
      <Link
        to="/account"
        className={cn(
          'flex items-center gap-2 rounded-lg px-2 py-2 text-sidebar-foreground no-underline hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors w-full',
          collapsed && 'justify-center px-0'
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
          <User className="h-4 w-4" />
        </div>
        {!collapsed && (
          <div className="flex min-w-0 flex-1 flex-col truncate">
            <span className="truncate text-sm font-medium">{me.name}</span>
            <span className="truncate text-xs text-muted-foreground">{me.email}</span>
          </div>
        )}
      </Link>
      {!collapsed && onLogout && (
        <button
          type="button"
          onClick={() => {
            onLogout();
            navigate('/login');
          }}
          className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          Sair
        </button>
      )}
    </div>
  );
}
