import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type AppLogoProps = {
  collapsed?: boolean;
  className?: string;
};

export function AppLogo({ collapsed, className }: AppLogoProps) {
  return (
    <Link
      to="/"
      className={cn(
        'flex items-center gap-2 font-semibold text-sidebar-foreground no-underline hover:text-sidebar-foreground/90 transition-colors',
        collapsed ? 'justify-center px-0 w-full' : 'px-2',
        className
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground',
          collapsed && 'h-9 w-9'
        )}
        aria-hidden
      >
        <span className="text-sm font-bold">S</span>
      </div>
      {!collapsed && <span className="truncate">Subscription</span>}
    </Link>
  );
}
