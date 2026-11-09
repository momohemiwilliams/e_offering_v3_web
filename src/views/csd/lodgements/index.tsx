import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { Page, Section } from '@/components/section';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { formatDateTime, formatMoney } from '@/lib/format';
import { allotmentStatus } from '@/lib/labels';
import { type Allotment, type Paginated } from '@/types';
import { Head, Link } from '@/lib/app';

/** CR s5.4: SEC-approved allotments and their lodgement status. */
export default function Lodgements({ allotments }: { allotments: Paginated<Allotment> }) {
    return (
        <AppLayout breadcrumbs={[{ title: 'Lodgements', href: route('csd.lodgements.index') }]}>
            <Head title="Lodgements" />
            <Page>
                <PageHeader title="Lodgements" description="Approved allotments transmitted by sponsors for CSD lodgement." />
                <Section flush>
                    <table className="w-full text-sm">
                        <thead className="bg-muted/60 text-muted-foreground text-left text-xs tracking-wide uppercase">
                            <tr>
                                <th className="px-4 py-2.5">Issue</th>
                                <th className="px-4 py-2.5">Sponsor</th>
                                <th className="px-4 py-2.5 text-right">Allotted</th>
                                <th className="px-4 py-2.5">Lodgement</th>
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
                                    <td className="px-4 py-3 text-right tabular-nums">{formatMoney(a.total_allotted, 0)}</td>
                                    <td className="px-4 py-3">
                                        {a.lodgement_reference ? (
                                            <>
                                                <span className="font-mono text-xs">{a.lodgement_reference}</span>
                                                <span className="text-muted-foreground block text-xs">{formatDateTime(a.lodged_at)}</span>
                                            </>
                                        ) : (
                                            <span className="text-muted-foreground">Awaiting sponsor</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusBadge map={allotmentStatus} value={a.status} />
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button size="sm" variant="outline" asChild>
                                            <Link href={route('csd.lodgements.show', a.id)}>View</Link>
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {allotments.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-muted-foreground px-4 py-10 text-center">
                                        No approved allotments yet.
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
