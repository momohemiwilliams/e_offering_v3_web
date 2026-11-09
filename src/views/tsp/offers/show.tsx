import { DecisionDialog } from '@/components/decision-dialog';
import { AmendmentList, DocumentsPanel, OfferFacts, OfferHistory, type OfferDetailProps, PartiesPanel, ReturnedBanner, WorkflowTimeline } from '@/components/offers/offer-detail';
import { PageHeader } from '@/components/page-header';
import { Page, Section, Steps } from '@/components/section';
import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { formatCompact, formatMoney } from '@/lib/format';
import { offerStatus } from '@/lib/labels';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@/lib/app';
import { BookOpenCheck, PencilLine, Rocket, Send } from 'lucide-react';

const stepIndex: Record<string, number> = { draft: 0, returned: 0, pending_authorisation: 1, pending_admin_review: 1, approved: 2, live: 3, cancelled: 3 };

/** Offer workspace for the TSP/RM: documents, submission, authorisation, launch, amendments. */
export default function TspOfferShow(props: OfferDetailProps & { isOwner: boolean }) {
    const { offer, isOwner, canBeAmended } = props;
    const { auth } = usePage<SharedData>().props;
    const inputter = isOwner && auth.user.access_level === 'inputter';
    const authoriser = isOwner && auth.user.access_level === 'authoriser';
    const editable = offer.status === 'draft' || offer.status === 'returned';
    const missing = props.requiredDocuments.filter((r) => !offer.documents?.some((d) => d.document_type === r && d.category === 'offer'));

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Offers', href: route('tsp.offers.index') },
                { title: offer.reference, href: route('tsp.offers.show', offer.id) },
            ]}
        >
            <Head title={offer.reference} />
            <Page>
                <PageHeader
                    title={offer.issuer_name}
                    description={
                        <span className="flex flex-wrap items-center gap-2">
                            {offer.reference} · {offer.security_type_label} · {offer.price_discovery_label} <StatusBadge map={offerStatus} value={offer.phase} />
                        </span>
                    }
                    actions={
                        <>
                            {inputter && editable && (
                                <Button variant="outline" asChild>
                                    <Link href={route('tsp.offers.edit', offer.id)}>
                                        <PencilLine className="size-4" /> Edit
                                    </Link>
                                </Button>
                            )}
                            {inputter && editable && (
                                <DecisionDialog
                                    href={route('tsp.offers.submit', offer.id)}
                                    title="Submit for approval"
                                    description={missing.length > 0 ? `Still missing: ${missing.join(', ')}.` : 'Your Authoriser will be notified to review the offer.'}
                                    trigger={
                                        <>
                                            <Send className="size-4" /> Submit for approval
                                        </>
                                    }
                                    confirmLabel="Submit"
                                />
                            )}
                            {authoriser && offer.status === 'pending_authorisation' && (
                                <>
                                    <DecisionDialog
                                        href={route('tsp.offers.authorise', offer.id)}
                                        title="Return to the Inputter"
                                        trigger="Return"
                                        triggerVariant="outline"
                                        data={{ approve: false }}
                                        reasonField="reason"
                                        reasonRequired
                                        destructive
                                    />
                                    <DecisionDialog
                                        href={route('tsp.offers.authorise', offer.id)}
                                        title="Approve offer"
                                        description="The Inputter is notified and can launch the offer."
                                        trigger="Approve"
                                        data={{ approve: true }}
                                        reasonField="reason"
                                        reasonLabel="Note (optional)"
                                    />
                                </>
                            )}
                            {inputter && offer.status === 'approved' && (
                                <DecisionDialog
                                    href={route('tsp.offers.launch', offer.id)}
                                    title="Launch offer"
                                    description="The offer becomes visible to eligible investors and opens for bidding on its open date."
                                    trigger={
                                        <>
                                            <Rocket className="size-4" /> Launch offer
                                        </>
                                    }
                                    confirmLabel="Launch"
                                />
                            )}
                            {inputter && canBeAmended && (
                                <Button variant="outline" asChild>
                                    <Link href={route('tsp.offers.amend', offer.id)}>
                                        <PencilLine className="size-4" /> Amend offer
                                    </Link>
                                </Button>
                            )}
                            {offer.status === 'live' && (
                                <Button asChild>
                                    <Link href={route('tsp.order-book.show', offer.id)}>
                                        <BookOpenCheck className="size-4" /> Order book
                                    </Link>
                                </Button>
                            )}
                        </>
                    }
                />
                <Section>
                    <Steps steps={['Prepare offer', 'Authorisation', 'Launch', 'Live']} current={stepIndex[offer.status] ?? 0} />
                </Section>
                <ReturnedBanner offer={offer} />

                <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard variant="navy" label="Offer size" value={formatCompact(Number(offer.offer_size))} hint={`Up to ${formatMoney(offer.offer_size)}`} />
                    <StatCard variant="gold" label="Bids received" value={props.bidStats.count} />
                    <StatCard variant="navy" label="Total subscribed" value={formatCompact(props.bidStats.total)} hint={formatMoney(props.bidStats.total)} />
                </div>

                <Section title="Offer details">
                    <OfferFacts offer={offer} />
                </Section>
                <div className="grid gap-6 lg:grid-cols-2">
                    <Section title="Supporting documents" description="Required for the selected security type.">
                        <DocumentsPanel offer={offer} required={props.requiredDocuments} canUpload={inputter && (editable || canBeAmended)} />
                    </Section>
                    <Section title="Approval workflow">
                        <WorkflowTimeline actions={props.workflow} />
                    </Section>
                </div>
                <Section title="Receiving agents & co-sponsors">
                    <PartiesPanel offer={offer} />
                </Section>
                <Section title="Amendments" description="Changes after launch, each approved and recorded with original and amended values.">
                    <AmendmentList
                        amendments={offer.amendments ?? []}
                        reviewRoute={(a) => (authoriser && a.status === 'pending_authorisation' ? route('tsp.amendments.review', a.id) : null)}
                    />
                </Section>
                <Section title="Audit trail">
                    <OfferHistory history={props.history} />
                </Section>
            </Page>
        </AppLayout>
    );
}
