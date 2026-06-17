import type { ReactNode } from 'react';
import { LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { SidebarTrigger } from '@/components/ui/sidebar';

type PortalTopBarProps = {
  badge?: string;
  userLabel?: string;
  onLogout: () => void;
  children?: ReactNode;
  /** Only set when this bar is rendered inside `SidebarProvider` (e.g. admin dashboard). */
  showSidebarTrigger?: boolean;
};

export function PortalTopBar({ badge, userLabel, onLogout, children, showSidebarTrigger }: PortalTopBarProps) {
  return (
    <header className="portal-header sticky top-0 z-50">
      <div className="flex h-14 items-center justify-between gap-3 px-4 lg:px-6">
        <div className="flex items-center gap-2">
          {showSidebarTrigger && (
            <SidebarTrigger className="md:hidden text-foreground" />
          )}
          {children}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {badge && (
            <Badge variant="secondary" className="hidden sm:inline-flex border-gold/30 bg-gold/10 text-gold font-medium">
              {badge}
            </Badge>
          )}
          {userLabel && (
            <span className="hidden md:inline text-sm text-muted-foreground max-w-[200px] truncate">{userLabel}</span>
          )}
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            className="rounded-full border-border/70 bg-background/70 hover:border-gold/40 hover:text-gold"
          >
            <LogOut size={15} className="mr-1.5" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

type PortalPageHeaderProps = {
  title: string;
  description?: string;
};

export function PortalPageHeader({ title, description }: PortalPageHeaderProps) {
  return (
    <div className="portal-page-header mb-8">
      <h1 className="font-display text-3xl font-normal tracking-tight text-foreground sm:text-4xl">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-sm sm:text-base text-muted-foreground">{description}</p>}
    </div>
  );
}
