import { DonutChart } from '@/components/charts';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { Page, Section } from '@/components/section';
import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { formatCompact, formatDateTime, formatMoney, formatRelative } from '@/lib/format';
import { bidStatus, outcomeStatus, paymentStatus } from '@/lib/labels';
import { type AppNotification, type Offer, type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@/lib/app';
import { OfferCard } from './offers/index';

export interface BidRow {
    id: number;
    reference: string;
    offer: { id: number; reference: string; issuer_name: string; security_type_label: string } | null;
    amount: number;
    rate: number | null;
    status: string;
    payment_status: string;
    submitted_at: string;
    allotment: { status: string; allotted: number | null; units: number | null };
}

interface Props {
    stats: { active_bids: number; subscribed: number; paid: number; allotted: number };
    portfolio: { type: string; value: number }[];
    openOffers: Offer[];
    bids: BidRow[];
    notifications: AppNotification[];
}

export function bidColumns() {
    return [
        {
            key: 'offer',
            header: 'Offer',
            value: (b: BidRow) => b.offer?.issuer_name,
            cell: (b: BidRow) => (
                <Link href={route('investor.bids.show', b.id)} className="hover:underline">
                    <span className="font-medium">{b.offer?.issuer_name}</span>
                    <span className="text-muted-foreground block font-mono text-[11px]">{b.reference}</span>
                </Link>
            ),
        },
        { key: 'type', header: 'Type', value: (b: BidRow) => b.offer?.security_type_label, cell: (b: BidRow) => b.offer?.security_type_label },
        { key: 'amount', header: 'Amount', align: 'right' as const, value: (b: BidRow) => b.amount, cell: (b: BidRow) => formatMoney(b.amount) },
        { key: 'when', header: 'Submitted', value: (b: BidRow) => b.submitted_at, cell: (b: BidRow) => <span className="whitespace-nowrap">{formatDateTime(b.submitted_at)}</span> },
        { key: 'status', header: 'Bid', value: (b: BidRow) => b.status, cell: (b: BidRow) => <StatusBadge map={bidStatus} value={b.status} /> },
        { key: 'pay', header: 'Payment', value: (b: BidRow) => b.payment_status, cell: (b: BidRow) => <StatusBadge map={paymentStatus} value={b.payment_status} /> },
        {
            key: 'allot',
            header: 'Allotment',
            value: (b: BidRow) => b.allotment.status,
            cell: (b: BidRow) => (
                <div>
                    <StatusBadge map={outcomeStatus} value={b.status === 'revoked' ? 'rejected' : b.allotment.status} />
                    {b.allotment.allotted !== null && <span className="mt-1 block text-xs">{formatMoney(b.allotment.allotted)}</span>}
                </div>
            ),
        },
    ];
}

/** CR s6.3 investor dashboard. */
export default function InvestorDashboard({ stats, portfolio, openOffers, bids, notifications }: Props) {
    const { auth } = usePage<SharedData>().props;

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: route('investor.dashboard') }]}>
            <Head title="Dashboard" />
            <Page>
                <PageHeader title={`Welcome, ${auth.user.institution?.name ?? auth.user.name.split(' ')[0]}`} description={auth.user.role_label} />
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard variant="navy" label="Active bids" value={stats.active_bids} href={route('investor.history')} />
                    <StatCard variant="gold" label="Total subscribed" value={formatCompact(stats.subscribed)} hint={formatMoney(stats.subscribed)} />
                    <StatCard variant="navy" label="Payments confirmed" value={formatCompact(stats.paid)} hint={formatMoney(stats.paid)} />
                    <StatCard variant="gold" label="Portfolio (allotted)" value={formatCompact(stats.allotted)} hint={formatMoney(stats.allotted)} />
                </div>

                <Section
                    title={`New offers: ${openOffers.length} available`}
                    description="Offers open for bidding that match your investor profile."
                    actions={
                        <Button variant="outline" size="sm" asChild>
                            <Link href={route('investor.offers.index')}>All offers</Link>
                        </Button>
                    }
                >
                    {openOffers.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No offers are open for bidding right now.</p>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {openOffers.map((o) => (
                                <OfferCard key={o.id} offer={o} />
                            ))}
                        </div>
                    )}
                </Section>

                <div className="grid gap-6 xl:grid-cols-3">
                    <Section title="Bids and allotment outcomes" className="xl:col-span-2" flush actions={<Button variant="outline" size="sm" asChild><Link href={route('investor.history')}>Full history</Link></Button>}>
                        <DataTable rows={bids} rowKey={(b) => b.id} emptyTitle="You have not placed any bids yet" columns={bidColumns()} />
                    </Section>
                    <div className="space-y-6">
                        <Section title="Portfolio by security type">
                            <DonutChart size={150} data={portfolio.map((p) => ({ label: p.type, value: p.value }))} centerLabel="Allotted" />
                        </Section>
                        <Section title="Latest notifications" actions={<Button variant="ghost" size="sm" asChild><Link href={route('notifications.index')}>All</Link></Button>}>
                            <ul className="space-y-3">
                                {notifications.map((n) => (
                                    <li key={n.id}>
                                        <button type="button" onClick={() => router.post(route('notifications.read', n.id))} className="text-left text-sm">
                                            <span className={n.read_at ? '' : 'font-semibold'}>{n.title}</span>
                                            <span className="text-muted-foreground block text-xs">{formatRelative(n.created_at)}</span>
                                        </button>
                                    </li>
                                ))}
                                {notifications.length === 0 && <p className="text-muted-foreground text-sm">No notifications.</p>}
                            </ul>
                        </Section>
                    </div>
                </div>
            </Page>
        </AppLayout>
    );
}
