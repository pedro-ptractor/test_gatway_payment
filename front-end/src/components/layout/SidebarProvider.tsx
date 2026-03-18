import * as React from 'react';
import { cn } from '@/lib/utils';

type SidebarContextValue = {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
}

const SIDEBAR_WIDTH = 16; // 16rem = 256px
const SIDEBAR_WIDTH_COLLAPSED = 3; // 3rem = 48px

export function SidebarProvider({
  children,
  defaultCollapsed = false,
  className,
  style,
}: {
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);
  const [open, setOpen] = React.useState(false);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, open, setOpen }}>
      <div
        className={cn('flex min-h-svh w-full', className)}
        style={{
          ...style,
          ['--sidebar-width' as string]: `${SIDEBAR_WIDTH}rem`,
          ['--sidebar-width-collapsed' as string]: `${SIDEBAR_WIDTH_COLLAPSED}rem`,
        }}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

export function SidebarInset({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <main className={cn('flex flex-1 flex-col min-w-0 md:min-w-[var(--sidebar-width-collapsed)]', className)}>
      {children}
    </main>
  );
}

export function SidebarOverlay() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx?.open) return null;
  return (
    <div
      className="fixed inset-0 z-30 bg-black/50 md:hidden"
      aria-hidden
      onClick={() => ctx.setOpen(false)}
    />
  );
}
