import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { SearchForm } from '@/components/search-form';
import { Page, Section } from '@/components/section';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { formatCompact, formatDate, formatMoney } from '@/lib/format';
import { offerStatus } from '@/lib/labels';
import { cn } from '@/lib/utils';
import { type Offer, type Paginated } from '@/types';
import { Head, Link, router } from '@/lib/app';
import { CalendarClock, Landmark } from 'lucide-react';
import { rateSummary } from '@/components/offers/offer-detail';

const typeTone: Record<string, string> = {
    equities: 'from-[#23346a] to-[#4566d0] text-white',
    depository_receipts: 'from-[#23346a] to-[#4566d0] text-white',
    bonds: 'from-[#c79d51] to-[#f1d49c] text-[#1a2744]',
    commercial_papers: 'from-[#1d326d] to-[#c79d51] text-white',
    non_interest: 'from-[#0f766e] to-[#5eead4] text-white',
    private_companies: 'from-[#4b5563] to-[#9ca3af] text-white',
};

/** Offer card (legacy "Featured e-Offers"), fixed to show the real rate and product type. */
export function OfferCard({ offer }: { offer: Offer }) {
    return (
        <Link href={route('investor.offers.show', offer.id)} className="group bg-card flex flex-col overflow-hidden rounded-xl border shadow-xs transition hover:-translate-y-0.5 hover:shadow-md">
            <div className={cn('bg-gradient-to-r px-5 py-3 text-xs font-semibold tracking-wide uppercase', typeTone[offer.security_type] ?? typeTone.bonds)}>{offer.security_type_label}</div>
            <div className="flex flex-1 flex-col gap-3 p-5">
                <div>
                    <p className="text-navy font-semibold dark:text-white">{offer.issuer_name}</p>
                    <p className="text-muted-foreground line-clamp-2 text-sm">{offer.issue_description}</p>
                </div>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                        <dt className="text-muted-foreground text-xs">Offer size</dt>
                        <dd className="font-semibold">Up to {formatCompact(Number(offer.offer_size))}</dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground text-xs">{offer.rate_label}</dt>
                        <dd className="text-gold font-semibold">{rateSummary(offer)}</dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground text-xs">Minimum bid</dt>
                        <dd>{formatMoney(offer.min_subscription_amount, 0)}</dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground text-xs">Issue price</dt>
                        <dd>{formatMoney(offer.issue_price, 2)}</dd>
                    </div>
                </dl>
                <p className="text-muted-foreground mt-auto flex items-center gap-1.5 text-xs">
                    <CalendarClock className="size-3.5" /> {formatDate(offer.open_at)} – {formatDate(offer.close_at)}
                </p>
                <div className="flex items-center justify-between">
                    <StatusBadge map={offerStatus} value={offer.phase} />
                    <span className="text-navy text-sm font-medium group-hover:underline dark:text-gold-light">Details →</span>
                </div>
            </div>
        </Link>
    );
}

export default function InvestorOffers({
    offers,
    filters,
    securityTypes,
}: {
    offers: Paginated<Offer>;
    filters: { type?: string; search?: string; show?: string };
    securityTypes: { value: string; label: string }[];
}) {
    const go = (patch: Record<string, string | undefined>) => router.get(route('investor.offers.index'), { ...filters, ...patch }, { preserveState: true, replace: true });

    return (
        <AppLayout breadcrumbs={[{ title: 'Offers', href: route('investor.offers.index') }]}>
            <Head title="Offers" />
            <Page>
                <PageHeader title="Featured e-Offers" description="Offers available to your investor category." />
                <Section>
                    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
                        <div className="flex flex-wrap gap-1">
                            <Button size="sm" variant={!filters.type ? 'default' : 'outline'} onClick={() => go({ type: undefined })}>
                                All
                            </Button>
                            {securityTypes.map((t) => (
                                <Button key={t.value} size="sm" variant={filters.type === t.value ? 'default' : 'outline'} onClick={() => go({ type: t.value })}>
                                    {t.label}
                                </Button>
                            ))}
                        </div>
                        <div className="flex items-center gap-3 md:ml-auto">
                            <label className="text-muted-foreground flex items-center gap-1.5 text-sm">
                                <input type="checkbox" checked={filters.show === 'all'} onChange={(e) => go({ show: e.target.checked ? 'all' : undefined })} /> Include closed
                            </label>
                            <SearchForm url={route('investor.offers.index')} initial={filters.search ?? ''} extra={{ type: filters.type, show: filters.show }} placeholder="Issuer or description" />
                        </div>
                    </div>
                    {offers.data.length === 0 ? (
                        <div className="text-muted-foreground flex flex-col items-center gap-2 py-12 text-sm">
                            <Landmark className="size-8 opacity-50" /> No offers match.
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {offers.data.map((o) => (
                                <OfferCard key={o.id} offer={o} />
                            ))}
                        </div>
                    )}
                    <Pagination paginator={offers as Paginated<unknown>} />
                </Section>
            </Page>
        </AppLayout>
    );
}
