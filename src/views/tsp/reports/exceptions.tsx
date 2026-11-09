import { PageHeader } from '@/components/page-header';
import { Page, Section } from '@/components/section';
import AppLayout from '@/layouts/app-layout';
import { ExceptionLists } from '@/views/tsp/reports/show';
import { type WorkflowAction } from '@/types';
import { Head } from '@/lib/app';
import { type ComponentProps } from 'react';

type Exceptions = ComponentProps<typeof ExceptionLists>['exceptions'];

/** CR s7 exception reporting across all of the sponsor's offers. */
export default function ExceptionsReport(props: Exceptions & { offers: Record<string, { id: number; reference: string; issuer_name: string }> }) {
    const { offers, ...exceptions } = props;
    const label = (id: number | null) => (id && offers[id] ? offers[id].reference : '—');

    return (
        <AppLayout breadcrumbs={[{ title: 'Exception Report', href: route('tsp.reports.exceptions') }]}>
            <Head title="Exception report" />
            <Page>
                <PageHeader title="Exception Report" description="Rejected bids, manual allotment overrides and offers returned by the TSP Authoriser, SEC or FMDQ Admin." />
                <Section>
                    <ExceptionLists exceptions={exceptions as Exceptions & { returns: WorkflowAction[] }} offerLabel={label} />
                </Section>
            </Page>
        </AppLayout>
    );
}
