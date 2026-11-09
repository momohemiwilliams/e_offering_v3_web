import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { Page, Section } from '@/components/section';
import AppLayout from '@/layouts/app-layout';
import { type Paginated } from '@/types';
import { Head } from '@/lib/app';
import { type BidRow, bidColumns } from '../dashboard';

/** Subscription and payment history (CR s6.3). */
export default function BidHistory({ bids }: { bids: Paginated<BidRow> }) {
    return (
        <AppLayout breadcrumbs={[{ title: 'My Bids & Payments', href: route('investor.history') }]}>
            <Head title="My bids" />
            <Page>
                <PageHeader title="My Bids & Payments" description="Every subscription, its payment status and the allotment outcome." />
                <Section flush>
                    <DataTable rows={bids.data} rowKey={(b) => b.id} searchable emptyTitle="You have not placed any bids yet" columns={bidColumns()} />
                    <Pagination paginator={bids as Paginated<unknown>} />
                </Section>
            </Page>
        </AppLayout>
    );
}
