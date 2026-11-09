import { DonutChart } from '@/components/charts';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { Page, Section } from '@/components/section';
import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { formatCompact, formatDate, formatDateTime, formatMoney } from '@/lib/format';
import { offerStatus } from '@/lib/labels';
import { type AuditLog, type Offer, type SharedData } from '@/types';
import { Head, Link, usePage } from '@/lib/app';
import { ClipboardCheck, FilePlus2 } from 'lucide-react';

interface Props {
    stats: { open: number; closed: number; total_subscribed: number; offers: number };
    byType: { type: string; count: number }[];
    recentOffers: Offer[];
    tasks: Record<string, number>;
    activity: AuditLog[];
    team: { id: number; name: string; email: string; access_level: string | null; last_login_at: string | null }[];
}

const taskLabels: Record<string, [string, string]> = {
    offers: ['Offers awaiting your approval', 'tsp.offers.index'],
    amendments: ['Amendments awaiting your approval', 'tsp.offers.index'],
    allotments: ['Allotments awaiting your approval', 'tsp.allotments.index'],
    returned: ['Offers returned for update', 'tsp.offers.index'],
    to_launch: ['Approved offers ready to launch', 'tsp.offers.index'],
    payments: ['Payment evidence to review', 'tsp.order-book.index'],
    ready_to_allot: ['Closed offers ready for allotment', 'tsp.allotments.index'],
};

export default function TspDashboard({ stats, byType, recentOffers, tasks, activity, team }: Props) {
    const { auth } = usePage<SharedData>().props;
    const pending = Object.entries(tasks).filter(([, n]) => n > 0);

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: route('tsp.dashboard') }]}>
            <Head title="Dashboard" />
            <Page>
                <PageHeader
                    title={`Welcome, ${auth.user.name.split(' ')[0]}`}
                    description={`${auth.user.institution?.name} · ${auth.user.role_label}`}
                    actions={
                        auth.user.access_level === 'inputter' && (
                            <Button asChild>
                                <Link href={route('tsp.offers.create')}>
                                    <FilePlus2 className="size-4" /> Create offer
                                </Link>
                            </Button>
                        )
                    }
                />
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard variant="gold" label="Open e-Offers (sponsored / co-sponsored)" value={stats.open} href={route('tsp.order-book.index')} />
                    <StatCard variant="navy" label="Closed e-Offers" value={stats.closed} href={route('tsp.allotments.index')} />
                    <StatCard variant="navy" label="Total value of subscriptions" value={formatCompact(stats.total_subscribed)} hint={formatMoney(stats.total_subscribed)} />
                    <StatCard variant="gold" label="All offers" value={stats.offers} href={route('tsp.offers.index')} />
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Section title="Your work queue" className="lg:col-span-1">
                        {pending.length === 0 ? (
                            <p className="text-muted-foreground flex items-center gap-2 text-sm">
                                <ClipboardCheck className="size-4 text-emerald-500" /> Nothing waiting for you.
                            </p>
                        ) : (
                            <ul className="space-y-2">
                                {pending.map(([key, n]) => (
                                    <li key={key}>
                                        <Link href={route(taskLabels[key][1])} className="hover:bg-muted flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                                            <span>{taskLabels[key][0]}</span>
                                            <span className="bg-gold text-navy-dark rounded-full px-2 py-0.5 text-xs font-semibold">{n}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Section>
                    <Section title="Offerings by type" className="lg:col-span-2">
                        <DonutChart data={byType.map((t) => ({ label: t.type, value: t.count }))} centerLabel="Offers" />
                    </Section>
                </div>

                <Section
                    title="Offer reports"
                    flush
                    actions={
                        <Button variant="outline" size="sm" asChild>
                            <Link href={route('tsp.offers.index')}>View more</Link>
                        </Button>
                    }
                >
                    <DataTable
                        rows={recentOffers}
                        rowKey={(o) => o.id}
                        emptyTitle="No offers yet"
                        columns={[
                            {
                                key: 'id',
                                header: 'Offer ID',
                                value: (o) => o.reference,
                                cell: (o) => (
                                    <Link href={route('tsp.offers.show', o.id)} className="text-navy font-mono text-xs font-semibold hover:underline dark:text-gold-light">
                                        {o.reference}
                                    </Link>
                                ),
                            },
                            { key: 'type', header: 'Product type', value: (o) => o.security_type_label, cell: (o) => o.security_type_label },
                            { key: 'issuer', header: 'Issuer', value: (o) => o.issuer_name, cell: (o) => o.issuer_name },
                            { key: 'size', header: 'Face value', align: 'right', value: (o) => Number(o.offer_size), cell: (o) => formatMoney(o.offer_size, 0) },
                            { key: 'sub', header: 'Subscribed', align: 'right', value: (o) => Number(o.subscribed ?? 0), cell: (o) => formatMoney(o.subscribed ?? 0, 0) },
                            { key: 'open', header: 'Open', value: (o) => o.open_at, cell: (o) => formatDate(o.open_at) },
                            { key: 'close', header: 'Close', value: (o) => o.close_at, cell: (o) => formatDate(o.close_at) },
                            { key: 'status', header: 'Status', value: (o) => o.phase, cell: (o) => <StatusBadge map={offerStatus} value={o.phase} /> },
                        ]}
                    />
                </Section>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Section title="Recent activity (your institution)">
                        <ol className="space-y-3">
                            {activity.map((a) => (
                                <li key={a.id} className="border-gold border-l-2 pl-3 text-sm">
                                    <p>{a.description}</p>
                                    <p className="text-muted-foreground text-xs">
                                        {a.actor_name} · {formatDateTime(a.created_at)}
                                    </p>
                                </li>
                            ))}
                            {activity.length === 0 && <p className="text-muted-foreground text-sm">No activity yet.</p>}
                        </ol>
                    </Section>
                    <Section title="Your team">
                        <ul className="divide-y text-sm">
                            {team.map((m) => (
                                <li key={m.id} className="flex items-center justify-between py-2">
                                    <span>
                                        {m.name}
                                        <span className="text-muted-foreground block text-xs">{m.email}</span>
                                    </span>
                                    <span className="text-right">
                                        <span className="capitalize">{m.access_level}</span>
                                        <span className="text-muted-foreground block text-xs">{m.last_login_at ? `Last seen ${formatDate(m.last_login_at)}` : 'Not signed in yet'}</span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </Section>
                </div>
            </Page>
        </AppLayout>
    );
}
