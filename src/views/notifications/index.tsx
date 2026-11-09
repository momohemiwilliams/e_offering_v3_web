import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { Page, Section } from '@/components/section';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { formatDateTime, formatRelative } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type AppNotification, type Paginated } from '@/types';
import { Head, router } from '@/lib/app';
import { Bell, CheckCheck } from 'lucide-react';

export default function Notifications({ notifications }: { notifications: Paginated<AppNotification> }) {
    const unread = notifications.data.some((n) => !n.read_at);

    return (
        <AppLayout breadcrumbs={[{ title: 'Notifications', href: route('notifications.index') }]}>
            <Head title="Notifications" />
            <Page>
                <PageHeader
                    title="Notifications"
                    description="Offer changes, bid and payment updates, approvals and allotment outcomes."
                    actions={
                        unread && (
                            <Button variant="outline" onClick={() => router.post(route('notifications.read-all'), {}, { preserveScroll: true })}>
                                <CheckCheck className="size-4" /> Mark all as read
                            </Button>
                        )
                    }
                />
                <Section flush>
                    {notifications.data.length === 0 ? (
                        <EmptyState icon={Bell} title="No notifications yet" />
                    ) : (
                        <ul className="divide-y">
                            {notifications.data.map((n) => (
                                <li key={n.id}>
                                    <button
                                        type="button"
                                        onClick={() => router.post(route('notifications.read', n.id))}
                                        className={cn('hover:bg-muted/50 flex w-full items-start gap-3 px-5 py-4 text-left', !n.read_at && 'bg-gold/5')}
                                    >
                                        <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', n.read_at ? 'bg-transparent' : 'bg-gold')} aria-hidden />
                                        <span className="min-w-0 flex-1">
                                            <span className={cn('block text-sm', !n.read_at && 'font-semibold')}>{n.title}</span>
                                            <span className="text-muted-foreground mt-0.5 block text-sm">{n.message}</span>
                                        </span>
                                        <span className="text-muted-foreground shrink-0 text-xs" title={formatDateTime(n.created_at)}>
                                            {formatRelative(n.created_at)}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                    <Pagination paginator={notifications as Paginated<unknown>} />
                </Section>
            </Page>
        </AppLayout>
    );
}
