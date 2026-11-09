import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { SearchForm } from '@/components/search-form';
import { Page, Section } from '@/components/section';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatMoney } from '@/lib/format';
import { offerStatus } from '@/lib/labels';
import { type Offer, type Paginated, type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@/lib/app';
import { FilePlus2 } from 'lucide-react';

export default function TspOffers({ offers, filters }: { offers: Paginated<Offer>; filters: { status?: string; search?: string } }) {
    const { auth } = usePage<SharedData>().props;

    return (
        <AppLayout breadcrumbs={[{ title: 'Offers', href: route('tsp.offers.index') }]}>
            <Head title="Offers" />
            <Page>
                <PageHeader
                    title="Your Offers"
                    description="Offers you sponsor or co-sponsor."
                    actions={
                        auth.user.access_level === 'inputter' && (
                            <Button asChild>
                                <Link href={route('tsp.offers.create')}>
                                    <FilePlus2 className="size-4" /> Create offer
                                </Link>
                            </Button>
                        )
                    }
                />
                <Section flush>
                    <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
                        <select
                            value={filters.status ?? ''}
                            onChange={(e) => router.get(route('tsp.offers.index'), { ...filters, status: e.target.value || undefined }, { preserveState: true })}
                            aria-label="Status"
                            className="border-input bg-background h-9 rounded-md border px-2 text-sm"
                        >
                            <option value="">All statuses</option>
                            {['draft', 'pending_authorisation', 'pending_admin_review', 'returned', 'approved', 'live', 'cancelled'].map((s) => (
                                <option key={s} value={s}>
                                    {offerStatus[s].label}
                                </option>
                            ))}
                        </select>
                        <SearchForm url={route('tsp.offers.index')} initial={filters.search ?? ''} extra={{ status: filters.status }} placeholder="Offer ID, issuer or description" />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/60 text-muted-foreground text-left text-xs tracking-wide uppercase">
                                <tr>
                                    <th className="px-4 py-2.5">Offer ID</th>
                                    <th className="px-4 py-2.5">Date created</th>
                                    <th className="px-4 py-2.5">Representative</th>
                                    <th className="px-4 py-2.5">Offer type</th>
                                    <th className="px-4 py-2.5 text-right">Offer size</th>
                                    <th className="px-4 py-2.5 text-right">Subscribed</th>
                                    <th className="px-4 py-2.5">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {offers.data.map((o) => (
                                    <tr key={o.id} className="hover:bg-muted/40 border-b last:border-0">
                                        <td className="px-4 py-3">
                                            <Link href={route('tsp.offers.show', o.id)} className="text-navy font-mono text-xs font-semibold hover:underline dark:text-gold-light">
                                                {o.reference}
                                            </Link>
                                            <span className="block">{o.issuer_name}</span>
                                            <span className="text-muted-foreground block max-w-xs truncate text-xs">{o.issue_description}</span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">{formatDate(o.created_at)}</td>
                                        <td className="px-4 py-3">
                                            {o.creator?.name}
                                            {o.institution_id !== auth.user.institution?.id && <span className="text-gold block text-xs">Co-sponsored · {o.institution?.name}</span>}
                                        </td>
                                        <td className="px-4 py-3">{o.security_type_label}</td>
                                        <td className="px-4 py-3 text-right tabular-nums">{formatMoney(o.offer_size, 0)}</td>
                                        <td className="px-4 py-3 text-right tabular-nums">{formatMoney(o.subscribed ?? 0, 0)}</td>
                                        <td className="px-4 py-3">
                                            <StatusBadge map={offerStatus} value={o.phase} />
                                        </td>
                                    </tr>
                                ))}
                                {offers.data.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-muted-foreground px-4 py-10 text-center">
                                            No offers yet.
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
