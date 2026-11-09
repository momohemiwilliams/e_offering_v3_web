import { DecisionDialog } from '@/components/decision-dialog';
import { FileField, TextField } from '@/components/form-field';
import { PageHeader } from '@/components/page-header';
import { DetailList, Page, Section } from '@/components/section';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { formatDateTime, formatMoney, formatNumber, formatRate } from '@/lib/format';
import { allotmentStatus, bidStatus, paymentStatus } from '@/lib/labels';
import { type Bid } from '@/types';
import { Head, Link, useForm } from '@/lib/app';
import { Info, PencilLine } from 'lucide-react';

interface Props {
    bid: Bid;
    canChange: boolean;
    canUploadEvidence: boolean;
    allotment: { allotted: string; units: string; released: string; filled_pct: string } | null;
    allotmentStatus: string | null;
}

const actionLabel: Record<string, string> = {
    submitted: 'Bid submitted',
    amended: 'Bid amended',
    revoked: 'Bid revoked',
    payment_uploaded: 'Evidence of payment uploaded',
    payment_valid: 'Payment confirmed (Paid)',
    payment_invalid: 'Payment marked Invalid',
};

/** Bid status, payment and full history (CR s6.1 steps 3-4, s6.2). */
export default function BidShow({ bid, canChange, canUploadEvidence, allotment, allotmentStatus: aStatus }: Props) {
    const offer = bid.offer!;
    const upload = useForm<{ evidence: File | null; payment_reference: string }>({ evidence: null, payment_reference: bid.payment_reference ?? '' });

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'My Bids', href: route('investor.history') },
                { title: bid.reference, href: route('investor.bids.show', bid.id) },
            ]}
        >
            <Head title={bid.reference} />
            <Page className="max-w-5xl">
                <PageHeader
                    title={offer.issuer_name}
                    description={
                        <span className="flex flex-wrap items-center gap-2">
                            Bid {bid.reference} <StatusBadge map={bidStatus} value={bid.status} /> <StatusBadge map={paymentStatus} value={bid.payment_status} />
                        </span>
                    }
                    actions={
                        canChange && (
                            <>
                                <DecisionDialog
                                    href={route('investor.bids.revoke', bid.id)}
                                    title="Revoke this bid"
                                    description="The bid is withdrawn from the order book. You can place a new bid while the offer is open."
                                    trigger="Revoke bid"
                                    triggerVariant="outline"
                                    destructive
                                    confirmLabel="Revoke"
                                />
                                <Button asChild>
                                    <Link href={route('investor.bids.edit', bid.id)}>
                                        <PencilLine className="size-4" /> Amend bid
                                    </Link>
                                </Button>
                            </>
                        )
                    }
                />
                <div className="flex items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200">
                    <Info className="mt-0.5 size-4 shrink-0" />
                    Your bid has been received. Submitting a bid does not guarantee allocation or allotment. Payment shows as “Pending” until the sponsor confirms it.
                </div>

                {allotment && (
                    <Section title="Allotment outcome" description={<StatusBadge map={allotmentStatus} value={aStatus} />}>
                        <DetailList
                            columns={4}
                            items={[
                                { label: 'Amount allotted', value: <span className="text-lg font-semibold">{formatMoney(allotment.allotted)}</span> },
                                { label: 'Units allotted', value: formatNumber(allotment.units, 4) },
                                { label: 'Amount released', value: formatMoney(allotment.released) },
                                { label: '% of subscription filled', value: `${Number(allotment.filled_pct)}%` },
                            ]}
                        />
                    </Section>
                )}

                <div className="grid gap-6 lg:grid-cols-2">
                    <Section title="Bid details">
                        <DetailList
                            items={[
                                { label: 'Amount', value: formatMoney(bid.amount) },
                                { label: offer.rate_label, value: bid.rate ? formatRate(bid.rate, offer.security_type === 'equities' ? '' : '%') : 'Fixed' },
                                { label: 'Investor type', value: bid.investor_type_label },
                                { label: 'Submitted', value: formatDateTime(bid.submitted_at) },
                                { label: 'CSD account', value: `${bid.csd_name ?? ''} ${bid.csd_account_number ?? ''}` },
                                { label: 'Refund account', value: `${bid.bank_name} · ${bid.bank_account_number}` },
                            ]}
                        />
                    </Section>
                    <Section title="Payment">
                        <div className="space-y-4">
                            <DetailList
                                items={[
                                    { label: 'Pay to', value: bid.payee_name },
                                    { label: 'Account', value: `${bid.payee_bank_name ?? ''} · ${bid.payee_account_name ?? ''} · ${bid.payee_account_number ?? ''}` },
                                    { label: 'Reference', value: bid.payment_reference },
                                    {
                                        label: 'Evidence',
                                        value: bid.evidence_url ? (
                                            <a href={bid.evidence_url} target="_blank" rel="noreferrer" className="underline">
                                                View uploaded evidence
                                            </a>
                                        ) : (
                                            'Not uploaded'
                                        ),
                                    },
                                ]}
                            />
                            {bid.payment_status === 'invalid' && bid.payment_comment && <p className="text-sm text-rose-600">Sponsor comment: {bid.payment_comment}</p>}
                            {canUploadEvidence && (
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        upload.post(route('investor.bids.evidence', bid.id), { forceFormData: true, preserveScroll: true, onSuccess: () => upload.reset('evidence') });
                                    }}
                                    className="space-y-3 rounded-lg border border-dashed p-3"
                                >
                                    <TextField label="Payment reference" value={upload.data.payment_reference} onChange={(v) => upload.setData('payment_reference', v)} />
                                    <FileField label={bid.has_evidence ? 'Replace evidence' : 'Upload evidence of payment'} required file={upload.data.evidence} onChange={(f) => upload.setData('evidence', f)} error={upload.errors.evidence} />
                                    <Button type="submit" size="sm" disabled={!upload.data.evidence || upload.processing}>
                                        Upload
                                    </Button>
                                </form>
                            )}
                        </div>
                    </Section>
                </div>

                <Section title="History">
                    <ol className="space-y-3">
                        {(bid.events ?? []).map((e) => (
                            <li key={e.id} className="border-gold border-l-2 pl-3 text-sm">
                                <p className="font-medium">{actionLabel[e.action] ?? e.action}</p>
                                {e.action === 'amended' && e.before && e.after && (
                                    <p className="text-muted-foreground text-xs">
                                        {Object.keys(e.after)
                                            .filter((k) => String(e.before![k] ?? '') !== String(e.after![k] ?? ''))
                                            .map((k) => `${k.replace(/_/g, ' ')}: ${e.before![k] ?? '—'} → ${e.after![k] ?? '—'}`)
                                            .join('; ')}
                                    </p>
                                )}
                                {e.comment && <p className="text-muted-foreground text-xs">{e.comment}</p>}
                                <p className="text-muted-foreground text-xs">
                                    {e.user?.name} · {formatDateTime(e.created_at)}
                                </p>
                            </li>
                        ))}
                    </ol>
                </Section>
            </Page>
        </AppLayout>
    );
}
