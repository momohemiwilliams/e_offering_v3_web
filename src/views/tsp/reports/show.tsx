import { BarChart, DonutChart, LineChart, SubscriptionMeter } from '@/components/charts';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { DetailList, Page, Section } from '@/components/section';
import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { formatCompact, formatDateTime, formatMoney, formatRate } from '@/lib/format';
import { allotmentStatus, categoryLabel, paymentStatus, stageLabel, subscriptionStatus } from '@/lib/labels';
import { type BookSummary, type Offer, type WorkflowAction } from '@/types';
import { Head } from '@/lib/app';
import { Download } from 'lucide-react';

interface Exceptions {
    rejectedBids: { id: number; reference: string; investor_name: string; amount: string; payment_comment: string | null; payment_reviewed_at: string | null }[];
    revokedBids: { id: number; reference: string; investor_name: string; amount: string; revoked_at: string | null }[];
    overrides: { id: number; override_amount: string; override_reason: string; overridden_at: string; subscribed: string; bid: { reference: string; investor_name: string }; overrider: { name: string } | null }[];
    returns: WorkflowAction[];
}

interface Props {
    offer: Offer;
    summary: BookSummary;
    ranking: { rank: number; reference: string; investor_name: string; rate: number | null; amount: number; payment_status: string }[];
    allotmentSummary: { method: string; status: string; total_allotted: number; residual: number; released: number; final_rate: number | null; investors_allotted: number } | null;
    exceptions: Exceptions;
}

/** CR s7: book-building analytics, allotment summary, exceptions and downloads for one offer. */
export default function ReportShow({ offer, summary, ranking, allotmentSummary, exceptions }: Props) {
    const suffix = offer.security_type === 'equities' || offer.security_type === 'depository_receipts' ? '' : '%';

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Offer Summary Report', href: route('tsp.reports.index') },
                { title: offer.reference, href: route('tsp.reports.show', offer.id) },
            ]}
        >
            <Head title={`Report · ${offer.reference}`} />
            <Page>
                <PageHeader
                    title={offer.issuer_name}
                    description={`${offer.reference} · ${offer.security_type_label} · ${offer.price_discovery_label}`}
                    actions={
                        <>
                            <Button variant="outline" asChild>
                                <a href={route('tsp.reports.summary-export', { offer: offer.id })}>
                                    <Download className="size-4" /> Offer summary
                                </a>
                            </Button>
                            <Button variant="outline" asChild>
                                <a href={route('tsp.order-book.export', { offer: offer.id })}>
                                    <Download className="size-4" /> Order book
                                </a>
                            </Button>
                            {offer.allotment && (
                                <Button variant="outline" asChild>
                                    <a href={route('tsp.allotments.export', { offer: offer.id })}>
                                        <Download className="size-4" /> Allotment schedule
                                    </a>
                                </Button>
                            )}
                            {offer.allotment?.status === 'lodged' && (
                                <Button variant="outline" asChild>
                                    <a href={route('tsp.allotments.export', { offer: offer.id, type: 'lodgement' })}>
                                        <Download className="size-4" /> Lodgement summary
                                    </a>
                                </Button>
                            )}
                        </>
                    }
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard variant="navy" label="Total subscription" value={formatCompact(summary.total_subscription)} hint={formatMoney(summary.total_subscription)} />
                    <StatCard variant="gold" label="Offer size" value={formatCompact(summary.offer_size)} />
                    <StatCard variant="navy" label="Bids / investors" value={`${summary.bids_count} / ${summary.investors_count}`} />
                    <StatCard variant="gold" label="Weighted average bid" value={formatRate(summary.weighted_average_rate, suffix)} hint={summary.final_rate !== null ? `Final ${formatRate(summary.final_rate, suffix)}` : undefined} />
                </div>

                <div className="grid gap-6 xl:grid-cols-3">
                    <Section title="Subscription level">
                        <div className="space-y-3">
                            <div className="flex items-end justify-between">
                                <span className="text-navy text-4xl font-semibold dark:text-white">{summary.subscription_level}%</span>
                                <StatusBadge map={subscriptionStatus} value={summary.status} />
                            </div>
                            <SubscriptionMeter level={summary.subscription_level} />
                            <DonutChart
                                size={150}
                                data={Object.entries(summary.by_category)
                                    .filter(([, v]) => v > 0)
                                    .map(([k, v]) => ({ label: categoryLabel[k], value: v }))}
                            />
                        </div>
                    </Section>
                    <Section title="Demand curve" className="xl:col-span-2">
                        <LineChart points={summary.demand_curve.map((p) => ({ x: p.rate, y: p.cumulative }))} reference={summary.offer_size} marker={summary.final_rate} xSuffix={suffix} />
                    </Section>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Section title="Price / rate distribution">
                        <BarChart data={summary.rate_distribution.map((r) => ({ label: String(r.rate), value: r.amount }))} labelSuffix={suffix} />
                    </Section>
                    <Section title="Allotment summary">
                        {allotmentSummary ? (
                            <DetailList
                                items={[
                                    { label: 'Methodology applied', value: allotmentSummary.method },
                                    { label: 'Status', value: <StatusBadge map={allotmentStatus} value={allotmentSummary.status} /> },
                                    { label: 'Total amount allotted', value: formatMoney(allotmentSummary.total_allotted) },
                                    { label: 'Residual balance', value: formatMoney(allotmentSummary.residual) },
                                    { label: 'Amount released to investors', value: formatMoney(allotmentSummary.released) },
                                    { label: 'Investors allotted', value: allotmentSummary.investors_allotted },
                                ]}
                            />
                        ) : (
                            <p className="text-muted-foreground text-sm">Allotment has not started.</p>
                        )}
                    </Section>
                </div>

                <Section title="Bid ranking" description="Best rate first, then by time received." flush>
                    <DataTable
                        rows={ranking}
                        rowKey={(r) => r.reference}
                        columns={[
                            { key: 'rank', header: '#', value: (r) => r.rank, cell: (r) => r.rank },
                            { key: 'inv', header: 'Investor', value: (r) => r.investor_name, cell: (r) => r.investor_name },
                            { key: 'rate', header: 'Rate', align: 'right', value: (r) => r.rate ?? 0, cell: (r) => formatRate(r.rate, suffix) },
                            { key: 'amt', header: 'Amount', align: 'right', value: (r) => r.amount, cell: (r) => formatMoney(r.amount) },
                            { key: 'pay', header: 'Payment', value: (r) => r.payment_status, cell: (r) => <StatusBadge map={paymentStatus} value={r.payment_status} /> },
                        ]}
                    />
                </Section>

                <Section title="Exceptions" description="Rejected payments, revoked bids, manual overrides and returns by the TSP Authoriser, SEC or FMDQ Admin.">
                    <ExceptionLists exceptions={exceptions} />
                </Section>
            </Page>
        </AppLayout>
    );
}

export function ExceptionLists({ exceptions, offerLabel }: { exceptions: Exceptions; offerLabel?: (offerId: number | null) => string }) {
    const empty = <p className="text-muted-foreground text-sm">None.</p>;

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <div>
                <h3 className="mb-2 text-sm font-semibold">Rejected payments ({exceptions.rejectedBids.length})</h3>
                {exceptions.rejectedBids.length === 0
                    ? empty
                    : exceptions.rejectedBids.map((b) => (
                          <p key={b.id} className="border-b py-1.5 text-sm">
                              {b.investor_name} · {formatMoney(b.amount, 0)} <span className="text-muted-foreground">— {b.payment_comment}</span>
                          </p>
                      ))}
            </div>
            <div>
                <h3 className="mb-2 text-sm font-semibold">Revoked bids ({exceptions.revokedBids.length})</h3>
                {exceptions.revokedBids.length === 0
                    ? empty
                    : exceptions.revokedBids.map((b) => (
                          <p key={b.id} className="border-b py-1.5 text-sm">
                              {b.investor_name} · {formatMoney(b.amount, 0)} <span className="text-muted-foreground">· {formatDateTime(b.revoked_at)}</span>
                          </p>
                      ))}
            </div>
            <div>
                <h3 className="mb-2 text-sm font-semibold">Manual overrides ({exceptions.overrides.length})</h3>
                {exceptions.overrides.length === 0
                    ? empty
                    : exceptions.overrides.map((o) => (
                          <p key={o.id} className="border-b py-1.5 text-sm">
                              {o.bid.investor_name}: {formatMoney(o.subscribed, 0)} → {formatMoney(o.override_amount, 0)}{' '}
                              <span className="text-muted-foreground">
                                  — {o.override_reason} ({o.overrider?.name}, {formatDateTime(o.overridden_at)})
                              </span>
                          </p>
                      ))}
            </div>
            <div>
                <h3 className="mb-2 text-sm font-semibold">Returned / rejected ({exceptions.returns.length})</h3>
                {exceptions.returns.length === 0
                    ? empty
                    : exceptions.returns.map((r) => (
                          <p key={r.id} className="border-b py-1.5 text-sm">
                              {offerLabel ? `${offerLabel(r.offer_id)} · ` : ''}
                              {stageLabel[r.stage]} · {r.subject_type.split('\\').pop()} <span className="text-muted-foreground">— {r.reason} ({formatDateTime(r.created_at)})</span>
                          </p>
                      ))}
            </div>
        </div>
    );
}
