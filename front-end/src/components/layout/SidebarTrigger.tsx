import { PanelLeft, PanelLeftClose } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/layout/SidebarProvider';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

export function SidebarTrigger({ className }: { className?: string }) {
  const { open, setOpen, collapsed, setCollapsed } = useSidebar();
  const isMobile = useMediaQuery('(max-width: 767px)');

  const handleClick = () => {
    if (isMobile) {
      setOpen(!open);
    } else {
      setCollapsed(!collapsed);
    }
  };

  const isExpanded = isMobile ? open : !collapsed;

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(className)}
      onClick={handleClick}
      aria-label={isExpanded ? 'Recolher menu' : 'Abrir menu'}
    >
      {isExpanded ? (
        <PanelLeftClose className="h-4 w-4" />
      ) : (
        <PanelLeft className="h-4 w-4" />
      )}
    </Button>
  );
}
