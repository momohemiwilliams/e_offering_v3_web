import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { SearchForm } from '@/components/search-form';
import { Page, Section } from '@/components/section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { formatDateTime } from '@/lib/format';
import { type AuditLog, type Paginated, type SharedData } from '@/types';
import { Head, router, usePage } from '@/lib/app';
import { Download } from 'lucide-react';

/** End-to-end audit trail (CR s7): every action from offer creation to CSD lodgement. */
export default function AuditIndex({
    logs,
    filters,
    offers,
}: {
    logs: Paginated<AuditLog>;
    filters: { search?: string; from?: string; to?: string; offer?: string };
    offers: { id: number; reference: string; issuer_name: string }[];
}) {
    const { auth } = usePage<SharedData>().props;
    const base = auth.user.type === 'admin' ? route('admin.audit') : auth.user.type === 'investor' ? route('investor.audit') : route('tsp.audit');
    const apply = (patch: Record<string, string | undefined>) => router.get(base, { ...filters, ...patch }, { preserveState: true, replace: true });

    return (
        <AppLayout breadcrumbs={[{ title: 'Audit Trail', href: base }]}>
            <Head title="Audit Trail" />
            <Page>
                <PageHeader
                    title="Audit Trail"
                    description="A time-stamped log of every action, including original and amended values."
                    actions={
                        <>
                            <Button variant="outline" asChild>
                                <a href={`${base}?${new URLSearchParams({ ...(filters as Record<string, string>), export: 'xlsx' })}`}>
                                    <Download className="size-4" /> Excel
                                </a>
                            </Button>
                            <Button variant="outline" asChild>
                                <a href={`${base}?${new URLSearchParams({ ...(filters as Record<string, string>), export: 'csv' })}`}>CSV</a>
                            </Button>
                        </>
                    }
                />
                <Section flush>
                    <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-end">
                        <div className="flex-1">
                            <SearchForm url={base} initial={filters.search ?? ''} extra={{ from: filters.from, to: filters.to, offer: filters.offer }} placeholder="Search user, action or description" />
                        </div>
                        <select
                            aria-label="Filter by offer"
                            value={filters.offer ?? ''}
                            onChange={(e) => apply({ offer: e.target.value || undefined })}
                            className="border-input bg-background h-9 rounded-md border px-2 text-sm lg:w-64"
                        >
                            <option value="">All offers</option>
                            {offers.map((o) => (
                                <option key={o.id} value={o.id}>
                                    {o.reference} — {o.issuer_name}
                                </option>
                            ))}
                        </select>
                        <div className="flex items-center gap-2">
                            <Input type="date" aria-label="From" value={filters.from ?? ''} onChange={(e) => apply({ from: e.target.value || undefined })} />
                            <span className="text-muted-foreground text-sm">to</span>
                            <Input type="date" aria-label="To" value={filters.to ?? ''} onChange={(e) => apply({ to: e.target.value || undefined })} />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/60">
                                <tr className="text-muted-foreground text-left text-xs tracking-wide uppercase">
                                    <th className="px-4 py-2.5">Date &amp; time</th>
                                    <th className="px-4 py-2.5">User</th>
                                    <th className="px-4 py-2.5">Action</th>
                                    <th className="px-4 py-2.5">Description</th>
                                    <th className="px-4 py-2.5">IP address</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.data.map((log) => (
                                    <tr key={log.id} className="border-b align-top last:border-0">
                                        <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                                        <td className="px-4 py-3">{log.actor_name ?? 'System'}</td>
                                        <td className="px-4 py-3">
                                            <code className="bg-muted rounded px-1.5 py-0.5 text-xs">{log.action}</code>
                                        </td>
                                        <td className="px-4 py-3">
                                            {log.description}
                                            {log.properties && Object.keys(log.properties).length > 0 && (
                                                <details className="mt-1">
                                                    <summary className="text-muted-foreground cursor-pointer text-xs">Details</summary>
                                                    <pre className="bg-muted mt-1 max-w-xl overflow-x-auto rounded p-2 text-[11px]">{JSON.stringify(log.properties, null, 2)}</pre>
                                                </details>
                                            )}
                                        </td>
                                        <td className="text-muted-foreground px-4 py-3 font-mono text-xs">{log.ip_address ?? '—'}</td>
                                    </tr>
                                ))}
                                {logs.data.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-muted-foreground px-4 py-10 text-center">
                                            No activity matches these filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination paginator={logs as Paginated<unknown>} />
                </Section>
            </Page>
        </AppLayout>
    );
}
