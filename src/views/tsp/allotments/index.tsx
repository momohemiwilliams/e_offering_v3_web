import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { Page, Section } from '@/components/section';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { formatDateTime, formatMoney, formatRate, toNumber } from '@/lib/format';
import { allotmentStatus } from '@/lib/labels';
import { type Offer } from '@/types';
import { Head, Link } from '@/lib/app';

/** CR s5.3: every issue with its allotment / SEC status (Approved, Rejected with reason, Pending). */
export default function AllotmentsIndex({ offers }: { offers: Offer[] }) {
    return (
        <AppLayout breadcrumbs={[{ title: 'Allotment', href: route('tsp.allotments.index') }]}>
            <Head title="Allotment" />
            <Page>
                <PageHeader title="Allotment" description="Initiate allotment once an offer closes, then track TSP Authoriser and SEC approval." />
                <Section flush>
                    <DataTable
                        rows={offers}
                        rowKey={(o) => o.id}
                        searchable
                        emptyTitle="No launched offers"
                        columns={[
                            {
                                key: 'id',
                                header: 'Offer ID',
                                value: (o) => o.reference,
                                cell: (o) => (
                                    <div>
                                        <span className="font-mono text-xs font-semibold">{o.reference}</span>
                                        <span className="block">{o.issuer_name}</span>
                                    </div>
                                ),
                            },
                            { key: 'type', header: 'Product type', value: (o) => o.security_type_label, cell: (o) => o.security_type_label },
                            { key: 'tenor', header: 'Tenor', value: (o) => o.tenor, cell: (o) => o.tenor ?? '—' },
                            { key: 'close', header: 'Closed', value: (o) => o.close_at, cell: (o) => formatDateTime(o.close_at) },
                            { key: 'sub', header: 'Total subscribed', align: 'right', value: (o) => toNumber(o.subscribed), cell: (o) => formatMoney(o.subscribed ?? 0, 0) },
                            { key: 'allotted', header: 'Allotted', align: 'right', value: (o) => toNumber(o.allotment?.total_allotted), cell: (o) => (o.allotment ? formatMoney(o.allotment.total_allotted, 0) : '—') },
                            { key: 'rate', header: 'Final rate', align: 'right', value: (o) => toNumber(o.allotment?.final_rate), cell: (o) => formatRate(o.allotment?.final_rate ?? null) },
                            {
                                key: 'status',
                                header: 'Allotment / SEC status',
                                value: (o) => o.allotment?.status ?? 'none',
                                cell: (o) => (
                                    <div>
                                        <StatusBadge map={allotmentStatus} value={o.allotment?.status ?? 'none'} />
                                        {o.allotment?.status === 'sec_rejected' && o.allotment.sec_reason && <p className="text-muted-foreground mt-1 max-w-[14rem] text-xs">{o.allotment.sec_reason}</p>}
                                    </div>
                                ),
                            },
                            {
                                key: 'action',
                                header: '',
                                sortable: false,
                                cell: (o) => {
                                    const closed = new Date(o.close_at.replace(' ', 'T')) < new Date();
                                    return (
                                        <Button size="sm" variant={o.allotment ? 'default' : 'outline'} asChild disabled={!closed && !o.allotment}>
                                            <Link href={route('tsp.allotments.show', o.id)}>{o.allotment ? 'Open' : closed ? 'Initiate' : 'Not closed'}</Link>
                                        </Button>
                                    );
                                },
                            },
                        ]}
                    />
                </Section>
            </Page>
        </AppLayout>
    );
}
