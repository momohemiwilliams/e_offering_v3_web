import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { SearchForm } from '@/components/search-form';
import { Page, Section } from '@/components/section';
import { StatusBadge } from '@/components/status-badge';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatMoney } from '@/lib/format';
import { offerStatus } from '@/lib/labels';
import { type Offer, type Paginated } from '@/types';
import { Head, Link, router } from '@/lib/app';

export default function AdminOffers({ offers, filters }: { offers: Paginated<Offer>; filters: { status?: string; search?: string; from?: string; to?: string } }) {
    const go = (patch: Record<string, string | undefined>) => router.get(route('admin.offers.index'), { ...filters, ...patch }, { preserveState: true, replace: true });

    return (
        <AppLayout breadcrumbs={[{ title: 'Offers', href: route('admin.offers.index') }]}>
            <Head title="Offers" />
            <Page>
                <PageHeader title="Offers" description="Every offer on the platform, by status." />
                <Section flush>
                    <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">
                        <select value={filters.status ?? ''} onChange={(e) => go({ status: e.target.value || undefined })} aria-label="Status" className="border-input bg-background h-9 rounded-md border px-2 text-sm">
                            <option value="">All statuses</option>
                            {['draft', 'pending_authorisation', 'pending_admin_review', 'returned', 'approved', 'live', 'cancelled'].map((s) => (
                                <option key={s} value={s}>
                                    {offerStatus[s].label}
                                </option>
                            ))}
                        </select>
                        <div className="flex items-center gap-2">
                            <Input type="date" aria-label="Open from" value={filters.from ?? ''} onChange={(e) => go({ from: e.target.value || undefined })} />
                            <span className="text-muted-foreground text-sm">to</span>
                            <Input type="date" aria-label="Open to" value={filters.to ?? ''} onChange={(e) => go({ to: e.target.value || undefined })} />
                        </div>
                        <div className="lg:ml-auto">
                            <SearchForm url={route('admin.offers.index')} initial={filters.search ?? ''} extra={{ status: filters.status, from: filters.from, to: filters.to }} placeholder="Offer ID or issuer" />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/60 text-muted-foreground text-left text-xs tracking-wide uppercase">
                                <tr>
                                    <th className="px-4 py-2.5">Offer ID</th>
                                    <th className="px-4 py-2.5">Product type</th>
                                    <th className="px-4 py-2.5">Sponsor</th>
                                    <th className="px-4 py-2.5 text-right">Offer size</th>
                                    <th className="px-4 py-2.5 text-right">Subscribed</th>
                                    <th className="px-4 py-2.5">Open – Close</th>
                                    <th className="px-4 py-2.5">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {offers.data.map((o) => (
                                    <tr key={o.id} className="hover:bg-muted/40 border-b last:border-0">
                                        <td className="px-4 py-3">
                                            <Link href={route('admin.offers.show', o.id)} className="text-navy font-mono text-xs font-semibold hover:underline dark:text-gold-light">
                                                {o.reference}
                                            </Link>
                                            <span className="block">{o.issuer_name}</span>
                                        </td>
                                        <td className="px-4 py-3">{o.security_type_label}</td>
                                        <td className="px-4 py-3">{o.institution?.name}</td>
                                        <td className="px-4 py-3 text-right tabular-nums">{formatMoney(o.offer_size, 0)}</td>
                                        <td className="px-4 py-3 text-right tabular-nums">{formatMoney(o.subscribed ?? 0, 0)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {formatDate(o.open_at)} – {formatDate(o.close_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge map={offerStatus} value={o.phase} />
                                        </td>
                                    </tr>
                                ))}
                                {offers.data.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-muted-foreground px-4 py-10 text-center">
                                            No offers match these filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination paginator={offers as Paginated<unknown>} />
                </Section>
            </Page>
        </AppLayout>
    );
}
