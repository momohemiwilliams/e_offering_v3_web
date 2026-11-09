import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { Page, Section } from '@/components/section';
import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { formatDateTime, formatMoney } from '@/lib/format';
import { allotmentStatus } from '@/lib/labels';
import { cn } from '@/lib/utils';
import { type Allotment, type Paginated } from '@/types';
import { Head, Link, router } from '@/lib/app';

/** CR s3.3 step 3: all offer allotments pending SEC approval. */
export default function RegulatorDashboard({ allotments, filters, counts }: { allotments: Paginated<Allotment & { authorised_at: string | null }>; filters: { status: string }; counts: Record<string, number> }) {
    return (
        <AppLayout breadcrumbs={[{ title: 'Allotment Reviews', href: route('regulator.dashboard') }]}>
            <Head title="Allotment reviews" />
            <Page>
                <PageHeader title="Allotment Reviews" description="Offers referred for regulatory sign-off of the basis of allotment and the final schedule." />
                <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard variant="gold" label="Pending your review" value={counts.sec_pending ?? 0} />
                    <StatCard variant="navy" label="Approved" value={(counts.approved ?? 0) + (counts.lodged ?? 0)} />
                    <StatCard label="Rejected" value={counts.sec_rejected ?? 0} />
                </div>
                <Section flush>
                    <div className="flex flex-wrap gap-1 border-b p-4">
                        {[
                            ['sec_pending', 'Pending'],
                            ['approved', 'Approved'],
                            ['sec_rejected', 'Rejected'],
                            ['lodged', 'Lodged'],
                            ['all', 'All'],
                        ].map(([k, v]) => (
                            <button
                                key={k}
                                onClick={() => router.get(route('regulator.dashboard'), { status: k }, { preserveState: true })}
                                className={cn('rounded-full px-3 py-1.5 text-sm', filters.status === k ? 'bg-navy text-white' : 'hover:bg-muted text-muted-foreground')}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                    <table className="w-full text-sm">
                        <thead className="bg-muted/60 text-muted-foreground text-left text-xs tracking-wide uppercase">
                            <tr>
                                <th className="px-4 py-2.5">Issue</th>
                                <th className="px-4 py-2.5">Sponsor</th>
                                <th className="px-4 py-2.5 text-right">Issue size</th>
                                <th className="px-4 py-2.5 text-right">Allotted</th>
                                <th className="px-4 py-2.5">Sent to SEC</th>
                                <th className="px-4 py-2.5">Status</th>
                                <th className="px-4 py-2.5" />
                            </tr>
                        </thead>
                        <tbody>
                            {allotments.data.map((a) => (
                                <tr key={a.id} className="border-b last:border-0">
                                    <td className="px-4 py-3">
                                        <span className="font-mono text-xs font-semibold">{a.offer?.reference}</span>
                                        <span className="block">{a.offer?.issuer_name}</span>
                                    </td>
                                    <td className="px-4 py-3">{a.offer?.institution?.name}</td>
                                    <td className="px-4 py-3 text-right tabular-nums">{formatMoney(a.issue_size, 0)}</td>
                                    <td className="px-4 py-3 text-right tabular-nums">{formatMoney(a.total_allotted, 0)}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">{a.authorised_at ? formatDateTime(a.authorised_at) : '—'}</td>
                                    <td className="px-4 py-3">
                                        <StatusBadge map={allotmentStatus} value={a.status} />
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button size="sm" variant={a.status === 'sec_pending' ? 'default' : 'outline'} asChild>
                                            <Link href={route('regulator.allotments.show', a.id)}>{a.status === 'sec_pending' ? 'Review' : 'View'}</Link>
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {allotments.data.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-muted-foreground px-4 py-10 text-center">
                                        Nothing in this view.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    <Pagination paginator={allotments as Paginated<unknown>} />
                </Section>
            </Page>
        </AppLayout>
    );
}
