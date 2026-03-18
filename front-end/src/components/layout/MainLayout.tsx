import { Outlet } from 'react-router-dom';
import { SidebarTrigger } from '@/components/layout/SidebarTrigger';
import { SidebarInset } from '@/components/layout/SidebarProvider';
import { Separator } from '@/components/ui/separator';

export function MainLayout() {
  return (
    <SidebarInset>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <span className="text-sm text-muted-foreground">Bem-vindo</span>
      </header>
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <Outlet />
      </div>
    </SidebarInset>
  );
}
