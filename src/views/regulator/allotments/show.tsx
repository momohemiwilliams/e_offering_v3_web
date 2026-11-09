import { DataTable } from '@/components/data-table';
import { DecisionDialog } from '@/components/decision-dialog';
import { OfferFacts, WorkflowTimeline } from '@/components/offers/offer-detail';
import { PageHeader } from '@/components/page-header';
import { Page, Section } from '@/components/section';
import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { formatCompact, formatMoney, formatNumber, formatRate, toNumber } from '@/lib/format';
import { allotmentStatus, categoryLabel, paymentStatus } from '@/lib/labels';
import { type Allotment, type Offer, type OfferDocument, type WorkflowAction } from '@/types';
import { Head } from '@/lib/app';
import { Download, FileText } from 'lucide-react';

interface Row {
    id: number;
    subscribed: string;
    allotted: string;
    units: string;
    released: string;
    filled_pct: string;
    eligible: boolean;
    ineligible_reason: string | null;
    override_reason: string | null;
    bid: { reference: string; investor_name: string; investor_category: string; investor_type_label: string; rate: string | null; csd_name: string | null; csd_account_number: string | null; payment_status: string; status: string };
}

interface Props {
    allotment: Allotment;
    offer: Offer;
    basis: Record<string, { allotted: string; percent: number; investors: number }>;
    schedule: Row[];
    rejected: Row[];
    offerDocuments: OfferDocument[];
    secDocuments: OfferDocument[];
    workflow: WorkflowAction[];
    canDecide: boolean;
    paymentSummary: { paid: number; pending: number; invalid: number };
}

/**
 * CR s3.3 step 5: supporting documentation, proposed basis of allotment (Retail / QII / Non-QII),
 * final allotment schedule, rejected applications and the Sponsor's letter; then the decision.
 */
export default function RegulatorReview({ allotment, offer, basis, schedule, rejected, offerDocuments, secDocuments, workflow, canDecide, paymentSummary }: Props) {
    const suffix = offer.security_type === 'equities' || offer.security_type === 'depository_receipts' ? '' : '%';
    const letter = secDocuments.filter((d) => d.category === 'sponsor_letter');

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Allotment Reviews', href: route('regulator.dashboard') },
                { title: offer.reference, href: route('regulator.allotments.show', allotment.id) },
            ]}
        >
            <Head title={`SEC review · ${offer.reference}`} />
            <Page>
                <PageHeader
                    title={offer.issuer_name}
                    description={
                        <span className="flex flex-wrap items-center gap-2">
                            {offer.reference} · {offer.institution?.name} · {allotment.method_label} <StatusBadge map={allotmentStatus} value={allotment.status} />
                        </span>
                    }
                    actions={
                        <>
                            <Button variant="outline" asChild>
                                <a href={route('regulator.allotments.export', allotment.id)}>
                                    <Download className="size-4" /> Schedule
                                </a>
                            </Button>
                            {canDecide && (
                                <>
                                    <DecisionDialog
                                        href={route('regulator.allotments.decide', allotment.id)}
                                        title="Reject the allotment"
                                        description="The sponsor sees the reason, updates the order book / schedule and resubmits."
                                        trigger="Reject"
                                        triggerVariant="outline"
                                        data={{ approve: false }}
                                        reasonField="reason"
                                        reasonRequired
                                        destructive
                                    />
                                    <DecisionDialog
                                        href={route('regulator.allotments.decide', allotment.id)}
                                        title="Approve the allotment"
                                        description="The issue moves to Approved; the sponsor can then lodge with the CSD and investors are told their outcome."
                                        trigger="Approve"
                                        data={{ approve: true }}
                                        reasonField="reason"
                                        reasonLabel="Note (optional)"
                                    />
                                </>
                            )}
                        </>
                    }
                />
                {allotment.sec_reason && (
                    <div className="bg-muted rounded-lg border p-4 text-sm">
                        <strong>Recorded reason:</strong> {allotment.sec_reason}
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard variant="navy" label="Approved issue size" value={formatCompact(toNumber(allotment.issue_size))} hint={formatMoney(allotment.issue_size)} />
                    <StatCard variant="gold" label="Valid demand" value={formatCompact(toNumber(allotment.valid_demand))} hint={`${Number(allotment.subscription_level)}% subscribed`} />
                    <StatCard variant="navy" label="Total allotted" value={formatCompact(toNumber(allotment.total_allotted))} hint={formatMoney(allotment.total_allotted)} />
                    <StatCard variant="gold" label="Final rate" value={formatRate(allotment.final_rate, suffix)} hint={`Payments: ${paymentSummary.paid} paid, ${paymentSummary.pending} pending, ${paymentSummary.invalid} invalid`} />
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Section title="Proposed basis of allotment">
                        <ul className="space-y-4 text-sm">
                            {Object.entries(basis).map(([k, b]) => (
                                <li key={k}>
                                    <div className="flex justify-between">
                                        <span className="font-medium">{categoryLabel[k]}</span>
                                        <span>{b.percent}%</span>
                                    </div>
                                    <div className="bg-muted mt-1 h-2 rounded-full">
                                        <div className="bg-navy h-2 rounded-full" style={{ width: `${b.percent}%` }} />
                                    </div>
                                    <p className="text-muted-foreground mt-1 text-xs">
                                        {formatMoney(b.allotted, 0)} to {b.investors} investor{b.investors === 1 ? '' : 's'}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </Section>
                    <Section title="Letter from Sponsor & supporting documents">
                        <ul className="space-y-2">
                            {[...letter, ...secDocuments.filter((d) => d.category !== 'sponsor_letter' && d.category !== 'lodgement'), ...offerDocuments].map((d) => (
                                <li key={d.id}>
                                    <a href={d.url} target="_blank" rel="noreferrer" className="hover:bg-muted flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                                        <FileText className="text-gold size-4" />
                                        <span className="flex-1">{d.document_type}</span>
                                        {d.category === 'sponsor_letter' && <span className="text-gold text-xs">Sponsor letter</span>}
                                    </a>
                                </li>
                            ))}
                            {letter.length === 0 && <p className="text-xs text-amber-600">No Letter from Sponsor attached.</p>}
                        </ul>
                    </Section>
                    <Section title="Approval workflow">
                        <WorkflowTimeline actions={workflow} />
                    </Section>
                </div>

                <Section title="Final allotment schedule" flush>
                    <DataTable
                        rows={schedule}
                        rowKey={(r) => r.id}
                        searchable
                        columns={[
                            { key: 'inv', header: 'Investor', value: (r) => r.bid.investor_name, cell: (r) => <span className="font-medium">{r.bid.investor_name}</span> },
                            { key: 'cat', header: 'Category', value: (r) => r.bid.investor_category, cell: (r) => `${categoryLabel[r.bid.investor_category]} · ${r.bid.investor_type_label}` },
                            { key: 'rate', header: 'Rate', align: 'right', value: (r) => toNumber(r.bid.rate), cell: (r) => formatRate(r.bid.rate, suffix) },
                            { key: 'sub', header: 'Subscribed', align: 'right', value: (r) => toNumber(r.subscribed), cell: (r) => formatMoney(r.subscribed) },
                            { key: 'all', header: 'Allotted', align: 'right', value: (r) => toNumber(r.allotted), cell: (r) => <strong>{formatMoney(r.allotted)}</strong> },
                            { key: 'units', header: 'Units', align: 'right', value: (r) => toNumber(r.units), cell: (r) => formatNumber(r.units, 2) },
                            { key: 'pct', header: '% filled', align: 'right', value: (r) => toNumber(r.filled_pct), cell: (r) => `${Number(r.filled_pct)}%` },
                            { key: 'pay', header: 'Payment', value: (r) => r.bid.payment_status, cell: (r) => <StatusBadge map={paymentStatus} value={r.bid.payment_status} /> },
                            { key: 'ovr', header: 'Override', cell: (r) => <span className="text-xs">{r.override_reason ?? ''}</span>, sortable: false },
                        ]}
                    />
                </Section>

                <Section title="Rejected applications" description="Revoked bids, invalid payments and bids that received no allotment." flush>
                    <DataTable
                        rows={rejected}
                        rowKey={(r) => r.id}
                        emptyTitle="No rejected applications"
                        columns={[
                            { key: 'inv', header: 'Investor', value: (r) => r.bid.investor_name, cell: (r) => r.bid.investor_name },
                            { key: 'ref', header: 'Bid', value: (r) => r.bid.reference, cell: (r) => <span className="font-mono text-xs">{r.bid.reference}</span> },
                            { key: 'sub', header: 'Subscribed', align: 'right', value: (r) => toNumber(r.subscribed), cell: (r) => formatMoney(r.subscribed) },
                            { key: 'why', header: 'Reason', value: (r) => r.ineligible_reason ?? 'No allotment', cell: (r) => r.ineligible_reason ?? 'No allotment under the methodology' },
                        ]}
                    />
                </Section>

                <Section title="Offer details">
                    <OfferFacts offer={offer} />
                </Section>
            </Page>
        </AppLayout>
    );
}
