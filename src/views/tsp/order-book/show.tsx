import { BarChart, DonutChart, LineChart, SubscriptionMeter } from '@/components/charts';
import { type Column, DataTable } from '@/components/data-table';
import { DecisionDialog } from '@/components/decision-dialog';
import { PageHeader } from '@/components/page-header';
import { Page, Section } from '@/components/section';
import { StatCard } from '@/components/stat-card';
import { StatusBadge, ToneBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';
import { formatCompact, formatDateTime, formatMoney, formatRate, toNumber } from '@/lib/format';
import { categoryLabel, offerStatus, paymentStatus, subscriptionStatus } from '@/lib/labels';
import { type Bid, type BookSummary, type Offer } from '@/types';
import { Head, Link, router } from '@/lib/app';
import { Download, ListChecks, Paperclip, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
    offer: Offer;
    bids: Bid[];
    summary: BookSummary;
    filters: { category?: string; payment?: string; include_revoked?: string };
    canConfirm: boolean;
    canInitiate: boolean;
    refreshedAt: string;
}

const REFRESH_SECONDS = 15;

/**
 * Live order book (CR s5.1, s6.1): bids appear immediately whatever their payment status,
 * the page re-polls every 15 seconds, and payment evidence is marked Valid / Invalid here.
 */
export default function OrderBookShow({ offer, bids, summary, filters, canConfirm, canInitiate, refreshedAt }: Props) {
    const [live, setLive] = useState(true);
    const suffix = offer.security_type === 'equities' || offer.security_type === 'depository_receipts' ? '' : '%';

    useEffect(() => {
        if (!live) return;
        const t = setInterval(() => router.reload({ only: ['bids', 'summary', 'refreshedAt'] }), REFRESH_SECONDS * 1000);
        return () => clearInterval(t);
    }, [live]);

    const filter = (patch: Record<string, string | undefined>) =>
        router.get(route('tsp.order-book.show', offer.id), { ...filters, ...patch }, { preserveState: true, preserveScroll: true, replace: true });

    const columns: Column<Bid>[] = [
        { key: 'sn', header: 'S/N', cell: (_b, i) => i + 1, sortable: false },
        {
            key: 'investor',
            header: 'Investor',
            value: (b) => b.investor_name,
            cell: (b) => (
                <div>
                    <span className="font-medium">{b.investor_name}</span>
                    <span className="text-muted-foreground block font-mono text-[11px]">{b.reference}</span>
                    {b.status === 'revoked' && <ToneBadge tone="neutral">Revoked</ToneBadge>}
                </div>
            ),
        },
        { key: 'through', header: 'Placed through', value: (b) => b.placed_through ?? b.payee_name, cell: (b) => <span className="text-xs">{b.placed_through ?? b.payee_name}</span> },
        {
            key: 'type',
            header: 'Investor type',
            value: (b) => b.investor_type_label,
            cell: (b) => (
                <div className="text-xs">
                    <span className="font-medium">{categoryLabel[b.investor_category]}</span>
                    <span className="text-muted-foreground block">{b.investor_type_label}</span>
                </div>
            ),
        },
        { key: 'rate', header: 'Bid rate', align: 'right', value: (b) => toNumber(b.rate), cell: (b) => formatRate(b.rate, suffix) },
        { key: 'yield', header: 'Bid yield', align: 'right', value: (b) => toNumber(b.yield), cell: (b) => formatRate(b.yield) },
        { key: 'amount', header: 'Face value', align: 'right', value: (b) => toNumber(b.amount), cell: (b) => <span className="font-semibold">{formatMoney(b.amount)}</span> },
        {
            key: 'payment',
            header: 'Payment',
            value: (b) => b.payment_status,
            cell: (b) => (
                <div className="space-y-1">
                    <StatusBadge map={paymentStatus} value={b.payment_status} />
                    {b.payment_comment && <p className="text-muted-foreground max-w-[12rem] text-[11px]">{b.payment_comment}</p>}
                    {b.reviewer && <p className="text-muted-foreground text-[11px]">by {b.reviewer}</p>}
                </div>
            ),
        },
        {
            key: 'evidence',
            header: 'Evidence',
            cell: (b) =>
                b.evidence_url ? (
                    <a href={b.evidence_url} target="_blank" rel="noreferrer" className="text-navy inline-flex items-center gap-1 text-xs underline dark:text-gold-light">
                        <Paperclip className="size-3" /> View
                    </a>
                ) : (
                    <span className="text-muted-foreground text-xs">None</span>
                ),
            sortable: false,
        },
        { key: 'received', header: 'Bid received', value: (b) => b.submitted_at, cell: (b) => <span className="text-xs whitespace-nowrap">{formatDateTime(b.submitted_at)}</span> },
        {
            key: 'csd',
            header: 'CSD / account',
            value: (b) => b.csd_account_number,
            cell: (b) => (
                <div className="text-xs">
                    {b.csd_name} {b.csd_account_number}
                    <span className="text-muted-foreground block">
                        {b.bank_account_name} · {b.bank_account_number}
                    </span>
                </div>
            ),
        },
    ];

    if (canConfirm) {
        columns.push({
            key: 'actions',
            header: '',
            sortable: false,
            cell: (b) =>
                b.status === 'active' && b.payment_status !== 'paid' ? (
                    <div className="flex gap-1.5">
                        <DecisionDialog
                            href={route('tsp.bids.payment', b.id)}
                            title={`Mark ${b.investor_name}'s payment Invalid`}
                            trigger="Invalid"
                            triggerVariant="outline"
                            triggerSize="sm"
                            data={{ valid: false }}
                            reasonField="comment"
                            reasonLabel="Comment (mandatory)"
                            reasonRequired
                            destructive
                        />
                        <DecisionDialog
                            href={route('tsp.bids.payment', b.id)}
                            title={`Confirm ${b.investor_name}'s payment`}
                            description={`${formatMoney(b.amount)} via ${b.payee_name}. The status changes to Paid and the investor is notified.`}
                            trigger="Valid"
                            triggerSize="sm"
                            data={{ valid: true }}
                        />
                    </div>
                ) : null,
        });
    }

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'View Order Book', href: route('tsp.order-book.index') },
                { title: offer.reference, href: route('tsp.order-book.show', offer.id) },
            ]}
        >
            <Head title={`Order book · ${offer.reference}`} />
            <Page>
                <PageHeader
                    title={offer.issuer_name}
                    description={
                        <span className="flex flex-wrap items-center gap-2">
                            {offer.reference} · {offer.price_discovery_label} · closes {formatDateTime(offer.close_at)} <StatusBadge map={offerStatus} value={offer.phase} />
                        </span>
                    }
                    actions={
                        <>
                            <Button variant="outline" asChild>
                                <a href={route('tsp.order-book.export', { offer: offer.id, format: 'xlsx' })}>
                                    <Download className="size-4" /> Excel
                                </a>
                            </Button>
                            <Button variant="outline" asChild>
                                <a href={route('tsp.order-book.export', { offer: offer.id, format: 'csv' })}>CSV</a>
                            </Button>
                            {canInitiate && (
                                <DecisionDialog
                                    href={route('tsp.allotments.initiate', offer.id)}
                                    title="Initiate allotment"
                                    description="The book is frozen for allotment. Investors can no longer amend or revoke bids."
                                    trigger={
                                        <>
                                            <ListChecks className="size-4" /> Initiate allotment
                                        </>
                                    }
                                    confirmLabel="Initiate allotment"
                                />
                            )}
                            {offer.allotment && (
                                <Button asChild>
                                    <Link href={route('tsp.allotments.show', offer.id)}>Open allotment</Link>
                                </Button>
                            )}
                        </>
                    }
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <StatCard variant="navy" label="Total subscription" value={formatCompact(summary.total_subscription)} hint={formatMoney(summary.total_subscription)} />
                    <StatCard variant="gold" label="Offer size" value={formatCompact(summary.offer_size)} hint={`Up to ${formatMoney(summary.offer_size)}`} />
                    <StatCard variant="navy" label="Total bids" value={summary.bids_count} hint={`${summary.investors_count} investors`} />
                    <StatCard variant="gold" label="Payments" value={`${summary.paid_count} paid`} hint={`${summary.pending_count} pending · ${summary.invalid_count} invalid`} />
                    <StatCard
                        variant="navy"
                        label={offer.price_discovery_method === 'fixed_rate' ? 'Fixed rate' : 'Weighted avg bid'}
                        value={offer.price_discovery_method === 'fixed_rate' ? formatRate(offer.rate, suffix) : formatRate(summary.weighted_average_rate, suffix)}
                        hint={summary.final_rate !== null ? `Final rate ${formatRate(summary.final_rate, suffix)}` : summary.min_rate !== null ? `Range ${summary.min_rate}–${summary.max_rate}` : undefined}
                    />
                </div>

                <div className="grid gap-6 xl:grid-cols-3">
                    <Section title="Subscription level" description="Valid demand compared with the offer size.">
                        <div className="space-y-4">
                            <div className="flex items-end justify-between">
                                <span className="text-navy text-4xl font-semibold dark:text-white">{summary.subscription_level}%</span>
                                <StatusBadge map={subscriptionStatus} value={summary.status} />
                            </div>
                            <SubscriptionMeter level={summary.subscription_level} />
                            {summary.oversubscription > 0 && <p className="text-sm">Oversubscribed by {summary.oversubscription}%.</p>}
                            <DonutChart
                                size={150}
                                data={Object.entries(summary.by_category)
                                    .filter(([, v]) => v > 0)
                                    .map(([k, v]) => ({ label: categoryLabel[k], value: v }))}
                                centerLabel="Demand"
                            />
                        </div>
                    </Section>
                    <Section title="Demand curve" description="Cumulative demand by bid rate against the offer size." className="xl:col-span-2">
                        <LineChart points={summary.demand_curve.map((p) => ({ x: p.rate, y: p.cumulative }))} reference={summary.offer_size} marker={summary.final_rate} xSuffix={suffix} />
                    </Section>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Section title="Rate distribution">
                        <BarChart data={summary.rate_distribution.map((r) => ({ label: String(r.rate), value: r.amount }))} labelSuffix={suffix} />
                    </Section>
                    <Section title="Demand by investor type">
                        <BarChart data={summary.by_investor_type.map((r) => ({ label: r.type.split(' ')[0], value: r.amount }))} />
                    </Section>
                </div>

                <Section
                    title="Order book"
                    description="Listed in the order bids were received."
                    flush
                    actions={
                        <span className="text-muted-foreground flex items-center gap-2 text-xs">
                            <RefreshCw className={`size-3.5 ${live ? 'animate-spin [animation-duration:3s]' : ''}`} />
                            Updated {formatDateTime(refreshedAt)}
                            <label className="ml-2 flex items-center gap-1">
                                <Checkbox checked={live} onCheckedChange={(v) => setLive(v === true)} /> Live
                            </label>
                        </span>
                    }
                >
                    <DataTable
                        rows={bids}
                        rowKey={(b) => b.id}
                        searchable
                        searchPlaceholder="Search investor, reference or CSD account"
                        emptyTitle="No bids yet"
                        rowClassName={(b) => (b.status === 'revoked' ? 'opacity-60' : undefined)}
                        toolbar={
                            <>
                                <select value={filters.category ?? ''} onChange={(e) => filter({ category: e.target.value || undefined })} aria-label="Category" className="border-input bg-background h-9 rounded-md border px-2 text-sm">
                                    <option value="">All categories</option>
                                    <option value="retail">Retail</option>
                                    <option value="qii">QIIs</option>
                                    <option value="non_qii">Non-QIIs</option>
                                </select>
                                <select value={filters.payment ?? ''} onChange={(e) => filter({ payment: e.target.value || undefined })} aria-label="Payment" className="border-input bg-background h-9 rounded-md border px-2 text-sm">
                                    <option value="">All payments</option>
                                    <option value="pending">Pending</option>
                                    <option value="paid">Paid</option>
                                    <option value="invalid">Invalid</option>
                                </select>
                                <label className="flex items-center gap-1.5 text-sm">
                                    <Checkbox checked={!!filters.include_revoked} onCheckedChange={(v) => filter({ include_revoked: v === true ? '1' : undefined })} /> Show revoked
                                </label>
                            </>
                        }
                        columns={columns}
                        footer={
                            bids.length > 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-3 text-right">
                                        Grand total ({bids.filter((b) => b.status === 'active').length} active bids)
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {formatMoney(bids.filter((b) => b.status === 'active').reduce((s, b) => s + toNumber(b.amount), 0))}
                                    </td>
                                    <td colSpan={columns.length - 7} />
                                </tr>
                            ) : undefined
                        }
                    />
                </Section>
            </Page>
        </AppLayout>
    );
}
