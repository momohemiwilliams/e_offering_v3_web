import { OfferFacts } from '@/components/offers/offer-detail';
import { PageHeader } from '@/components/page-header';
import { Page, Section } from '@/components/section';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { formatDateTime, formatMoney } from '@/lib/format';
import { amendableLabels, offerStatus, paymentStatus } from '@/lib/labels';
import { type Amendment, type Bid, type Offer, type OfferDocument } from '@/types';
import { Head, Link } from '@/lib/app';
import { FileText, HandCoins } from 'lucide-react';

interface Props {
    offer: Offer;
    documents: OfferDocument[];
    myBids: Bid[];
    canBid: boolean;
    amendments: Pick<Amendment, 'id' | 'changes' | 'reason' | 'applied_at'>[];
}

/** CR s6.1 step 1: offer with its documents, then the commitment form. */
export default function InvestorOfferShow({ offer, documents, myBids, canBid, amendments }: Props) {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Offers', href: route('investor.offers.index') },
                { title: offer.issuer_name, href: route('investor.offers.show', offer.id) },
            ]}
        >
            <Head title={offer.issuer_name} />
            <Page>
                <PageHeader
                    title={offer.issuer_name}
                    description={
                        <span className="flex flex-wrap items-center gap-2">
                            {offer.reference} · {offer.security_type_label} · Sponsor: {offer.institution?.name} <StatusBadge map={offerStatus} value={offer.phase} />
                        </span>
                    }
                    actions={
                        canBid && (
                            <Button asChild>
                                <Link href={route('investor.bids.create', offer.id)}>
                                    <HandCoins className="size-4" /> Place a bid
                                </Link>
                            </Button>
                        )
                    }
                />
                {!canBid && offer.phase === 'upcoming' && (
                    <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200">
                        Bidding opens on {formatDateTime(offer.open_at)}.
                    </div>
                )}
                {amendments.length > 0 && (
                    <Section title="Changes to this offer" description="The sponsor amended these details after launch.">
                        <ul className="space-y-3 text-sm">
                            {amendments.map((a) => (
                                <li key={a.id} className="border-gold border-l-2 pl-3">
                                    <p className="text-muted-foreground text-xs">{formatDateTime(a.applied_at)}</p>
                                    {Object.entries(a.changes).map(([k, c]) => (
                                        <p key={k}>
                                            {amendableLabels[k] ?? k}: <span className="text-muted-foreground line-through">{c.from ?? '—'}</span> → <strong>{c.to}</strong>
                                        </p>
                                    ))}
                                    <p className="text-muted-foreground">Reason: {a.reason}</p>
                                </li>
                            ))}
                        </ul>
                    </Section>
                )}
                <div className="grid gap-6 xl:grid-cols-3">
                    <Section title="Offer details" className="xl:col-span-2">
                        <OfferFacts offer={offer} />
                    </Section>
                    <div className="space-y-6">
                        <Section title="Offer documents">
                            <ul className="space-y-2">
                                {documents.map((d) => (
                                    <li key={d.id}>
                                        <a href={d.url} target="_blank" rel="noreferrer" className="hover:bg-muted flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                                            <FileText className="text-gold size-4" /> {d.document_type}
                                        </a>
                                    </li>
                                ))}
                                {documents.length === 0 && <p className="text-muted-foreground text-sm">No documents published.</p>}
                            </ul>
                        </Section>
                        <Section title="Your bids">
                            <ul className="space-y-2">
                                {myBids.map((b) => (
                                    <li key={b.id}>
                                        <Link href={route('investor.bids.show', b.id)} className="hover:bg-muted flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                                            <span>
                                                {formatMoney(b.amount)}
                                                <span className="text-muted-foreground block text-xs">{b.status === 'revoked' ? 'Revoked' : formatDateTime(b.submitted_at)}</span>
                                            </span>
                                            <StatusBadge map={paymentStatus} value={b.payment_status} />
                                        </Link>
                                    </li>
                                ))}
                                {myBids.length === 0 && <p className="text-muted-foreground text-sm">You have not bid on this offer.</p>}
                            </ul>
                        </Section>
                    </div>
                </div>
            </Page>
        </AppLayout>
    );
}
