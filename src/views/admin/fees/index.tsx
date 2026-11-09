import { DecisionDialog } from '@/components/decision-dialog';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { Page, Section } from '@/components/section';
import { StatusBadge } from '@/components/status-badge';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatDateTime, formatMoney } from '@/lib/format';
import { feeStatus } from '@/lib/labels';
import { cn } from '@/lib/utils';
import { type FeeInvoice, type Paginated } from '@/types';
import { Head, Link, router } from '@/lib/app';

/** CR s3.2 step 8: FMDQ Admin reviews and approves the TSP/RM platform fee payment. */
export default function FeesIndex({ invoices, filters, feeEnabled }: { invoices: Paginated<FeeInvoice>; filters: { status: string }; feeEnabled: boolean }) {
    return (
        <AppLayout breadcrumbs={[{ title: 'Platform Fees', href: route('admin.fees.index') }]}>
            <Head title="Platform fees" />
            <Page>
                <PageHeader title="Platform Fees" description="Annual TSP/RM platform fee payments (Paystack, Flutterwave or bank transfer)." />
                {!feeEnabled && (
                    <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200">
                        The annual platform fee is switched off (first year of launch). TSP/RMs get full access after registration.{' '}
                        <Link href={route('admin.settings')} className="font-medium underline">
                            Settings
                        </Link>
                    </div>
                )}
                <Section flush>
                    <div className="flex flex-wrap gap-1 border-b p-4">
                        {[
                            ['pending_review', 'To confirm'],
                            ['unpaid', 'Unpaid'],
                            ['paid', 'Paid'],
                            ['rejected', 'Rejected'],
                            ['all', 'All'],
                        ].map(([k, v]) => (
                            <button
                                key={k}
                                onClick={() => router.get(route('admin.fees.index'), { status: k }, { preserveState: true })}
                                className={cn('rounded-full px-3 py-1.5 text-sm', filters.status === k ? 'bg-navy text-white' : 'hover:bg-muted text-muted-foreground')}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/60 text-muted-foreground text-left text-xs tracking-wide uppercase">
                                <tr>
                                    <th className="px-4 py-2.5">Invoice</th>
                                    <th className="px-4 py-2.5">TSP/RM</th>
                                    <th className="px-4 py-2.5">Period</th>
                                    <th className="px-4 py-2.5 text-right">Amount</th>
                                    <th className="px-4 py-2.5">Method</th>
                                    <th className="px-4 py-2.5">Status</th>
                                    <th className="px-4 py-2.5" />
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.data.map((i) => (
                                    <tr key={i.id} className="border-b align-top last:border-0">
                                        <td className="px-4 py-3 font-mono text-xs">
                                            {i.reference}
                                            {i.gateway_reference && <span className="text-muted-foreground block">Ref: {i.gateway_reference}</span>}
                                        </td>
                                        <td className="px-4 py-3">{i.institution?.name}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {formatDate(i.period_start)} – {formatDate(i.period_end)}
                                            <span className="text-muted-foreground block text-xs">Due {formatDate(i.due_date)}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums">{formatMoney(i.amount)}</td>
                                        <td className="px-4 py-3 capitalize">
                                            {i.method?.replace('_', ' ') ?? '—'}
                                            {i.evidence_url && (
                                                <a href={i.evidence_url} target="_blank" rel="noreferrer" className="text-navy block text-xs underline dark:text-gold-light">
                                                    View evidence
                                                </a>
                                            )}
                                            {i.paid_at && <span className="text-muted-foreground block text-xs">{formatDateTime(i.paid_at)}</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge map={feeStatus} value={i.status} />
                                            {i.review_comment && <span className="text-muted-foreground mt-1 block text-xs">{i.review_comment}</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            {i.status === 'pending_review' && (
                                                <div className="flex justify-end gap-2">
                                                    <DecisionDialog
                                                        href={route('admin.fees.reject', i.id)}
                                                        title="Reject payment"
                                                        trigger="Reject"
                                                        triggerVariant="outline"
                                                        triggerSize="sm"
                                                        reasonField="comment"
                                                        reasonLabel="Comment for the TSP/RM"
                                                        reasonRequired
                                                        destructive
                                                    />
                                                    <DecisionDialog
                                                        href={route('admin.fees.approve', i.id)}
                                                        title="Confirm payment"
                                                        description="The TSP/RM is notified, can download a receipt and gets full access for the year."
                                                        trigger="Confirm"
                                                        triggerSize="sm"
                                                    />
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {invoices.data.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-muted-foreground px-4 py-10 text-center">
                                            No invoices in this view.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination paginator={invoices as Paginated<unknown>} />
                </Section>
            </Page>
        </AppLayout>
    );
}
