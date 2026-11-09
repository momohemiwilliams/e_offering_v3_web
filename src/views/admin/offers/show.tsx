import { DecisionDialog } from '@/components/decision-dialog';
import { AmendmentList, DocumentsPanel, OfferFacts, OfferHistory, type OfferDetailProps, PartiesPanel, ReturnedBanner, WorkflowTimeline } from '@/components/offers/offer-detail';
import { PageHeader } from '@/components/page-header';
import { Page, Section } from '@/components/section';
import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import AppLayout from '@/layouts/app-layout';
import { TextField } from '@/components/form-field';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatCompact, formatDateTime, formatMoney } from '@/lib/format';
import { offerStatus } from '@/lib/labels';
import { Head, useForm } from '@/lib/app';

/** FMDQ Admin view of an offer, with the (normally disabled) review gate of CR s4.4. */
interface OfferNote {
    id: number;
    title: string;
    body: string;
    created_at: string;
    author?: { name: string } | null;
}

export default function AdminOfferShow(props: OfferDetailProps & { notes: OfferNote[] }) {
    const { offer } = props;
    const noteForm = useForm({ title: '', body: '' });
    const pendingReview = offer.status === 'pending_admin_review';

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Offers', href: route('admin.offers.index') },
                { title: offer.reference, href: route('admin.offers.show', offer.id) },
            ]}
        >
            <Head title={offer.reference} />
            <Page>
                <PageHeader
                    title={offer.issuer_name}
                    description={
                        <span className="flex flex-wrap items-center gap-2">
                            {offer.reference} · {offer.security_type_label} · {offer.institution?.name} <StatusBadge map={offerStatus} value={offer.phase} />
                        </span>
                    }
                    actions={
                        pendingReview && (
                            <>
                                <DecisionDialog
                                    href={route('admin.offers.review', offer.id)}
                                    title="Return offer to the TSP/RM"
                                    trigger="Return"
                                    triggerVariant="outline"
                                    data={{ approve: false }}
                                    reasonField="reason"
                                    reasonRequired
                                    destructive
                                />
                                <DecisionDialog
                                    href={route('admin.offers.review', offer.id)}
                                    title="Approve offer"
                                    description="The TSP/RM is notified and can launch the offer."
                                    trigger="Approve"
                                    data={{ approve: true }}
                                    reasonField="reason"
                                    reasonLabel="Note (optional)"
                                />
                            </>
                        )
                    }
                />
                <ReturnedBanner offer={offer} />
                <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard variant="navy" label="Offer size" value={formatCompact(Number(offer.offer_size))} hint={formatMoney(offer.offer_size)} />
                    <StatCard variant="gold" label="Bids" value={props.bidStats.count} />
                    <StatCard variant="navy" label="Total subscribed" value={formatCompact(props.bidStats.total)} />
                </div>
                <Section title="Offer details">
                    <OfferFacts offer={offer} />
                </Section>
                <div className="grid gap-6 lg:grid-cols-2">
                    <Section title="Supporting documents">
                        <DocumentsPanel offer={offer} required={props.requiredDocuments} canUpload={false} />
                    </Section>
                    <Section title="Approval workflow">
                        <WorkflowTimeline actions={props.workflow} />
                    </Section>
                </div>
                <Section title="Receiving agents & co-sponsors">
                    <PartiesPanel offer={offer} />
                </Section>
                <Section title="Amendments">
                    <AmendmentList
                        amendments={offer.amendments ?? []}
                        reviewRoute={(a) => (a.status === 'pending_admin_review' ? route('admin.amendments.review', a.id) : null)}
                    />
                </Section>
                <Section title="Audit trail">
                    <OfferHistory history={props.history} />
                </Section>
                <Section title="Commitment notes" description="Internal notes for FMDQ admins only.">
                    <form
                        className="space-y-3"
                        onSubmit={(e) => {
                            e.preventDefault();
                            noteForm.post(route('admin.offers.notes', offer.id), { preserveScroll: true, onSuccess: () => noteForm.reset() });
                        }}
                    >
                        <TextField label="Title" required value={noteForm.data.title} onChange={(v) => noteForm.setData('title', v)} error={noteForm.errors.title} />
                        <div className="grid gap-1.5">
                            <Label htmlFor="note-body">Note</Label>
                            <Textarea id="note-body" rows={3} required value={noteForm.data.body} onChange={(e) => noteForm.setData('body', e.target.value)} />
                            <InputError message={noteForm.errors.body} />
                        </div>
                        <Button type="submit" disabled={noteForm.processing}>
                            Save note
                        </Button>
                    </form>
                    <ul className="mt-5 divide-y border-t">
                        {props.notes.map((note) => (
                            <li key={note.id} className="py-3 text-sm">
                                <p className="font-medium">{note.title}</p>
                                <p className="text-muted-foreground whitespace-pre-line">{note.body}</p>
                                <p className="text-muted-foreground mt-1 text-xs">
                                    {note.author?.name} · {formatDateTime(note.created_at)}
                                </p>
                            </li>
                        ))}
                        {props.notes.length === 0 && <li className="text-muted-foreground py-3 text-sm">No notes yet.</li>}
                    </ul>
                </Section>
            </Page>
        </AppLayout>
    );
}
