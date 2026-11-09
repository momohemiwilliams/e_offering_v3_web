import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { Page, Section } from '@/components/section';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatMoney, toNumber } from '@/lib/format';
import { allotmentStatus } from '@/lib/labels';
import { type Offer } from '@/types';
import { Head, Link } from '@/lib/app';

/** CR s5.5 / s7: Offer Summary Report and analytics per offer. */
export default function ReportsIndex({ offers }: { offers: Offer[] }) {
    return (
        <AppLayout breadcrumbs={[{ title: 'Offer Summary Report', href: route('tsp.reports.index') }]}>
            <Head title="Reports" />
            <Page>
                <PageHeader
                    title="Offer Summary Report"
                    description="Book-building analytics, allotment summaries and downloadable reports."
                    actions={
                        <Button variant="outline" asChild>
                            <Link href={route('tsp.reports.exceptions')}>Exception report</Link>
                        </Button>
                    }
                />
                <Section flush>
                    <DataTable
                        rows={offers}
                        rowKey={(o) => o.id}
                        searchable
                        emptyTitle="No launched offers yet"
                        columns={[
                            {
                                key: 'id',
                                header: 'Offer',
                                value: (o) => o.reference,
                                cell: (o) => (
                                    <div>
                                        <span className="font-mono text-xs font-semibold">{o.reference}</span>
                                        <span className="block">{o.issuer_name}</span>
                                    </div>
                                ),
                            },
                            { key: 'type', header: 'Type', value: (o) => o.security_type_label, cell: (o) => o.security_type_label },
                            { key: 'size', header: 'Offer size', align: 'right', value: (o) => toNumber(o.offer_size), cell: (o) => formatMoney(o.offer_size, 0) },
                            { key: 'sub', header: 'Subscribed', align: 'right', value: (o) => toNumber(o.subscribed), cell: (o) => formatMoney(o.subscribed ?? 0, 0) },
                            {
                                key: 'level',
                                header: 'Subscription',
                                align: 'right',
                                value: (o) => toNumber(o.subscribed) / Math.max(1, toNumber(o.offer_size)),
                                cell: (o) => `${Math.round((toNumber(o.subscribed) / Math.max(1, toNumber(o.offer_size))) * 1000) / 10}%`,
                            },
                            { key: 'bids', header: 'Bids', align: 'right', value: (o) => o.bids_count ?? 0, cell: (o) => o.bids_count ?? 0 },
                            { key: 'close', header: 'Closed', value: (o) => o.close_at, cell: (o) => formatDate(o.close_at) },
                            { key: 'allot', header: 'Allotment', value: (o) => o.allotment?.status ?? 'none', cell: (o) => <StatusBadge map={allotmentStatus} value={o.allotment?.status ?? 'none'} /> },
                            {
                                key: 'go',
                                header: '',
                                sortable: false,
                                cell: (o) => (
                                    <Button size="sm" asChild>
                                        <Link href={route('tsp.reports.show', o.id)}>View report</Link>
                                    </Button>
                                ),
                            },
                        ]}
                    />
                </Section>
            </Page>
        </AppLayout>
    );
}
