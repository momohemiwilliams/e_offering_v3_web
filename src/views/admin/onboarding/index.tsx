import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { SearchForm } from '@/components/search-form';
import { Page, Section } from '@/components/section';
import { StatusBadge } from '@/components/status-badge';
import AppLayout from '@/layouts/app-layout';
import { formatDateTime } from '@/lib/format';
import { institutionStatus, institutionTypeLabel } from '@/lib/labels';
import { cn } from '@/lib/utils';
import { type Institution, type Paginated } from '@/types';
import { Head, Link, router } from '@/lib/app';

const tabs = [
    ['pending', 'Pending'],
    ['approved', 'Approved'],
    ['rejected', 'Rejected'],
    ['suspended', 'Suspended'],
    ['all', 'All'],
];

export default function OnboardingIndex({
    institutions,
    filters,
    counts,
    recentRetail,
}: {
    institutions: Paginated<Institution>;
    filters: { status: string; type?: string; search?: string };
    counts: Record<string, number>;
    recentRetail: { id: number; name: string; email: string; status: string; created_at: string }[];
}) {
    const go = (patch: Record<string, string | undefined>) => router.get(route('admin.onboarding.index'), { ...filters, ...patch }, { preserveState: true, replace: true });

    return (
        <AppLayout breadcrumbs={[{ title: 'Onboarding Requests', href: route('admin.onboarding.index') }]}>
            <Head title="Onboarding requests" />
            <Page>
                <PageHeader title="Onboarding Requests" description="Review TSP/RM, QII / Non-QII and Regulator (SEC / CBN) requests." />
                <Section flush>
                    <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-wrap gap-1" role="tablist">
                            {tabs.map(([key, label]) => (
                                <button
                                    key={key}
                                    role="tab"
                                    aria-selected={filters.status === key}
                                    onClick={() => go({ status: key })}
                                    className={cn(
                                        'rounded-full px-3 py-1.5 text-sm',
                                        filters.status === key ? 'bg-navy text-white' : 'hover:bg-muted text-muted-foreground',
                                    )}
                                >
                                    {label}
                                    {key !== 'all' && counts[key] ? <span className="ml-1 opacity-70">({counts[key]})</span> : null}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <select value={filters.type ?? ''} onChange={(e) => go({ type: e.target.value || undefined })} aria-label="Type" className="border-input bg-background h-9 rounded-md border px-2 text-sm">
                                <option value="">All types</option>
                                {Object.entries(institutionTypeLabel).map(([k, v]) => (
                                    <option key={k} value={k}>
                                        {v}
                                    </option>
                                ))}
                            </select>
                            <SearchForm url={route('admin.onboarding.index')} initial={filters.search ?? ''} extra={{ status: filters.status, type: filters.type }} placeholder="Name, email or reference" />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/60 text-muted-foreground text-left text-xs tracking-wide uppercase">
                                <tr>
                                    <th className="px-4 py-2.5">Reference</th>
                                    <th className="px-4 py-2.5">Institution</th>
                                    <th className="px-4 py-2.5">Type</th>
                                    <th className="px-4 py-2.5 text-right">Users</th>
                                    <th className="px-4 py-2.5">Submitted</th>
                                    <th className="px-4 py-2.5">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {institutions.data.map((i) => (
                                    <tr key={i.id} className="hover:bg-muted/40 border-b last:border-0">
                                        <td className="px-4 py-3 font-mono text-xs">
                                            <Link href={route('admin.onboarding.show', i.id)} className="text-navy font-semibold hover:underline dark:text-gold-light">
                                                {i.reference}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3">
                                            {i.name}
                                            <span className="text-muted-foreground block text-xs">{i.email}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {institutionTypeLabel[i.type]}
                                            {i.regulator_body ? ` (${i.regulator_body})` : ''}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums">{i.users_count}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(i.created_at)}</td>
                                        <td className="px-4 py-3">
                                            <StatusBadge map={institutionStatus} value={i.status} />
                                        </td>
                                    </tr>
                                ))}
                                {institutions.data.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-muted-foreground px-4 py-10 text-center">
                                            No requests in this view.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination paginator={institutions as Paginated<unknown>} />
                </Section>

                <Section title="Recently onboarded retail investors" description="Retail onboarding is BVN-verified and activated automatically (unchanged flow).">
                    <ul className="divide-y text-sm">
                        {recentRetail.map((r) => (
                            <li key={r.id} className="flex justify-between py-2">
                                <span>
                                    {r.name} <span className="text-muted-foreground">· {r.email}</span>
                                </span>
                                <span className="text-muted-foreground">{formatDateTime(r.created_at)}</span>
                            </li>
                        ))}
                        {recentRetail.length === 0 && <li className="text-muted-foreground py-2">None yet.</li>}
                    </ul>
                </Section>
            </Page>
        </AppLayout>
    );
}
