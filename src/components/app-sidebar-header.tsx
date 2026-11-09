import { Breadcrumbs } from '@/components/breadcrumbs';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType, type SharedData } from '@/types';
import { Link, usePage } from '@/lib/app';
import { Bell } from 'lucide-react';

/** Page header: menu toggle + breadcrumb on the left; notifications, role and theme on the right. */
export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const { auth, notifications } = usePage<SharedData>().props;
    const unread = notifications?.unread ?? 0;

    return (
        <header className="border-sidebar-border/50 bg-background/80 sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b px-4 backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-6">
            <div className="flex min-w-0 items-center gap-2">
                <SidebarTrigger className="-ml-1" aria-label="Toggle menu" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="ml-auto flex items-center gap-1.5">
                {auth?.user && (
                    <span className="border-gold/50 bg-gold/10 text-navy hidden rounded-full border px-3 py-1 text-xs font-medium sm:inline dark:text-gold-light">
                        {auth.user.role_label}
                        {auth.user.institution && auth.user.type !== 'regulator' ? ` · ${auth.user.institution.name}` : ''}
                    </span>
                )}
                <Button variant="ghost" size="icon" asChild className="relative" aria-label={`Notifications (${unread} unread)`}>
                    <Link href={route('notifications.index')}>
                        <Bell className="size-5" />
                        {unread > 0 && (
                            <span className="bg-gold text-navy-dark absolute -top-0.5 -right-0.5 flex min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold">
                                {unread > 99 ? '99+' : unread}
                            </span>
                        )}
                    </Link>
                </Button>
                <ThemeToggle />
            </div>
        </header>
    );
}
