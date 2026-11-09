import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { Page, Section } from '@/components/section';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { formatDateTime, formatMoney, toNumber } from '@/lib/format';
import { offerStatus } from '@/lib/labels';
import { type Offer } from '@/types';
import { Head, Link } from '@/lib/app';

/** CR s5.1 step 1: issues tied to the TSP/RM with an option to view each order book. */
export default function OrderBookIndex({ offers }: { offers: Offer[] }) {
    return (
        <AppLayout breadcrumbs={[{ title: 'View Order Book', href: route('tsp.order-book.index') }]}>
            <Head title="Order book" />
            <Page>
                <PageHeader title="View Order Book" description="Live order books for your launched offers." />
                <Section flush>
                    <DataTable
                        rows={offers}
                        rowKey={(o) => o.id}
                        searchable
                        emptyTitle="No launched offers yet"
                        columns={[
                            { key: 'id', header: 'Offer ID', value: (o) => o.reference, cell: (o) => <span className="font-mono text-xs font-semibold">{o.reference}</span> },
                            { key: 'issue', header: 'Issue', value: (o) => o.issuer_name, cell: (o) => o.issuer_name },
                            { key: 'desc', header: 'Issue description', value: (o) => o.issue_description, cell: (o) => <span className="line-clamp-2 max-w-xs">{o.issue_description}</span> },
                            { key: 'size', header: 'Offer size', align: 'right', value: (o) => toNumber(o.offer_size), cell: (o) => formatMoney(o.offer_size, 0) },
                            { key: 'sub', header: 'Subscribed', align: 'right', value: (o) => toNumber(o.subscribed), cell: (o) => formatMoney(o.subscribed ?? 0, 0) },
                            { key: 'bids', header: 'Bids', align: 'right', value: (o) => o.bids_count ?? 0, cell: (o) => o.bids_count ?? 0 },
                            { key: 'open', header: 'Open date', value: (o) => o.open_at, cell: (o) => formatDateTime(o.open_at) },
                            { key: 'close', header: 'Close date', value: (o) => o.close_at, cell: (o) => formatDateTime(o.close_at) },
                            { key: 'status', header: 'Status', value: (o) => o.phase, cell: (o) => <StatusBadge map={offerStatus} value={o.phase} /> },
                            {
                                key: 'action',
                                header: '',
                                cell: (o) => (
                                    <Button size="sm" asChild>
                                        <Link href={route('tsp.order-book.show', o.id)}>View order book</Link>
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
