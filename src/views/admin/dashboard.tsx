import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { Page, Section } from '@/components/section';
import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { formatCompact, formatDate, formatDateTime, formatMoney } from '@/lib/format';
import { offerStatus } from '@/lib/labels';
import { type AuditLog, type Offer } from '@/types';
import { Head, Link } from '@/lib/app';
import { AlertTriangle } from 'lucide-react';

interface Stats {
    open_offers: number;
    live_offers: number;
    sponsors: number;
    investors: number;
    pending_onboarding: number;
    pending_fees: number;
    pending_admin_review: number;
    sec_pending: number;
    total_subscribed: number;
}

export default function AdminDashboard({ stats, offers, activity, adminReviewEnabled }: { stats: Stats; offers: Offer[]; activity: AuditLog[]; adminReviewEnabled: boolean }) {
    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: route('admin.dashboard') }]}>
            <Head title="Admin dashboard" />
            <Page>
                <PageHeader title="Dashboard" description="Platform activity across sponsors, investors and regulators." />
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard variant="navy" label="Open offers" value={stats.open_offers} hint={`${stats.live_offers} launched in total`} href={route('admin.offers.index', { status: 'live' })} />
                    <StatCard variant="gold" label="Transaction sponsors" value={stats.sponsors} href={route('admin.users.index', { type: 'tsp' })} />
                    <StatCard variant="navy" label="Investors" value={stats.investors} href={route('admin.users.index', { type: 'investor' })} />
                    <StatCard variant="gold" label="Total subscribed" value={formatCompact(stats.total_subscribed)} hint={formatMoney(stats.total_subscribed)} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="Onboarding requests to review" value={stats.pending_onboarding} href={route('admin.onboarding.index')} />
                    <StatCard label="Platform fees to confirm" value={stats.pending_fees} href={route('admin.fees.index')} />
                    <StatCard label="Allotments pending SEC" value={stats.sec_pending} />
                    <StatCard
                        label="Offers awaiting FMDQ review"
                        value={stats.pending_admin_review}
                        hint={adminReviewEnabled ? 'FMDQ review gate is ON' : 'FMDQ review gate is off (CR s4.4)'}
                        href={route('admin.offers.index', { status: 'pending_admin_review' })}
                    />
                </div>

                {!adminReviewEnabled && (
                    <div className="flex items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        <p>
                            The FMDQ Admin review step is built in but disabled, so TSP Authoriser approval alone lets sponsors launch offers.{' '}
                            <Link href={route('admin.settings')} className="font-medium underline">
                                Change in Settings
                            </Link>
                        </p>
                    </div>
                )}

                <div className="grid gap-6 xl:grid-cols-3">
                    <Section
                        className="xl:col-span-2"
                        title="Latest offers"
                        flush
                        actions={
                            <Button variant="outline" size="sm" asChild>
                                <Link href={route('admin.offers.index')}>View all</Link>
                            </Button>
                        }
                    >
                        <DataTable
                            rows={offers}
                            rowKey={(o) => o.id}
                            emptyTitle="No offers yet"
                            columns={[
                                {
                                    key: 'ref',
                                    header: 'Offer',
                                    value: (o) => o.reference,
                                    cell: (o) => (
                                        <Link href={route('admin.offers.show', o.id)} className="text-navy font-medium hover:underline dark:text-gold-light">
                                            {o.reference}
                                            <span className="text-muted-foreground block text-xs font-normal">{o.issuer_name}</span>
                                        </Link>
                                    ),
                                },
                                { key: 'type', header: 'Type', value: (o) => o.security_type_label, cell: (o) => o.security_type_label },
                                { key: 'sponsor', header: 'Sponsor', value: (o) => o.institution?.name, cell: (o) => o.institution?.name },
                                { key: 'open', header: 'Open', value: (o) => o.open_at, cell: (o) => formatDate(o.open_at) },
                                { key: 'status', header: 'Status', value: (o) => o.phase, cell: (o) => <StatusBadge map={offerStatus} value={o.phase} /> },
                            ]}
                        />
                    </Section>
                    <Section title="Recent activity">
                        <ol className="space-y-4">
                            {activity.map((a) => (
                                <li key={a.id} className="border-gold border-l-2 pl-3 text-sm">
                                    <p>{a.description}</p>
                                    <p className="text-muted-foreground text-xs">
                                        {a.actor_name ?? 'System'} · {formatDateTime(a.created_at)}
                                    </p>
                                </li>
                            ))}
                            {activity.length === 0 && <p className="text-muted-foreground text-sm">No activity yet.</p>}
                        </ol>
                    </Section>
                </div>
            </Page>
        </AppLayout>
    );
}
