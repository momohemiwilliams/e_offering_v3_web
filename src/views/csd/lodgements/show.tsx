import { PageHeader } from '@/components/page-header';
import { DetailList, Page, Section } from '@/components/section';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { formatDateTime, formatMoney } from '@/lib/format';
import { allotmentStatus } from '@/lib/labels';
import { type Allotment, type OfferDocument } from '@/types';
import { Head } from '@/lib/app';
import { Download, FileText } from 'lucide-react';

/** CR s5.4 step 3: lodgement summary, downloadable by the CSD and the TSP/RM. */
export default function LodgementShow({ allotment, headings, rows, documents }: { allotment: Allotment; headings: string[]; rows: (string | number | null)[][]; documents: OfferDocument[] }) {
    const offer = allotment.offer!;

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Lodgements', href: route('csd.lodgements.index') },
                { title: offer.reference, href: route('csd.lodgements.show', allotment.id) },
            ]}
        >
            <Head title={`Lodgement · ${offer.reference}`} />
            <Page>
                <PageHeader
                    title={offer.issuer_name}
                    description={
                        <span className="flex items-center gap-2">
                            {offer.reference} · {offer.institution?.name} <StatusBadge map={allotmentStatus} value={allotment.status} />
                        </span>
                    }
                    actions={
                        <>
                            <Button variant="outline" asChild>
                                <a href={route('csd.lodgements.download', { allotment: allotment.id, format: 'csv' })}>CSV</a>
                            </Button>
                            <Button asChild>
                                <a href={route('csd.lodgements.download', { allotment: allotment.id, format: 'xlsx' })}>
                                    <Download className="size-4" /> Lodgement summary
                                </a>
                            </Button>
                        </>
                    }
                />
                <Section>
                    <DetailList
                        columns={4}
                        items={[
                            { label: 'Lodgement reference', value: allotment.lodgement_reference ?? 'Not transmitted yet' },
                            { label: 'Transmitted', value: allotment.lodged_at ? formatDateTime(allotment.lodged_at) : null },
                            { label: 'Transmission status', value: allotment.lodgement_status },
                            { label: 'Total allotted', value: formatMoney(allotment.total_allotted) },
                        ]}
                    />
                    {documents.length > 0 && (
                        <ul className="mt-4 flex flex-wrap gap-2">
                            {documents.map((d) => (
                                <li key={d.id}>
                                    <a href={d.url} className="hover:bg-muted flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm">
                                        <FileText className="text-gold size-4" /> {d.original_name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                </Section>
                <Section title="Investor-level lodgement instructions" flush>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/60 text-muted-foreground text-left text-xs tracking-wide uppercase">
                                <tr>
                                    {headings.map((h) => (
                                        <th key={h} className="px-3 py-2.5 whitespace-nowrap">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r, i) => (
                                    <tr key={i} className="border-b last:border-0">
                                        {r.map((c, j) => (
                                            <td key={j} className="px-3 py-2 whitespace-nowrap">
                                                {c ?? '—'}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Section>
            </Page>
        </AppLayout>
    );
}
