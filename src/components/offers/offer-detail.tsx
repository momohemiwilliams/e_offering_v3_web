import { CopyButton } from '@/components/copy-button';
import { DecisionDialog } from '@/components/decision-dialog';
import { FileField } from '@/components/form-field';
import { DetailList, Section } from '@/components/section';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatDateTime, formatMoney, formatRate } from '@/lib/format';
import { amendableLabels, amendmentStatus, categoryLabel, stageLabel } from '@/lib/labels';
import { type Amendment, type AuditLog, type Offer, type WorkflowAction } from '@/types';
import { router, useForm } from '@/lib/app';
import { CheckCircle2, Circle, FileText, Trash2, XCircle } from 'lucide-react';
import { FormEvent } from 'react';

export interface OfferDetailProps {
    offer: Offer;
    requiredDocuments: string[];
    workflow: WorkflowAction[];
    history: AuditLog[];
    bidStats: { count: number; total: number };
    universeLabels: Record<string, string>;
    canBeAmended: boolean;
}

/** Rate / price parameters by price-discovery method (CR s4.3). */
export function rateSummary(offer: Offer): string {
    const suffix = offer.security_type === 'equities' || offer.security_type === 'depository_receipts' ? '' : '%';
    if (offer.price_discovery_method === 'fixed_rate') return formatRate(offer.rate, suffix);
    if (offer.price_discovery_method === 'book_building') return `${formatRate(offer.rate_min, suffix)} – ${formatRate(offer.rate_max, suffix)}`;
    return 'Bids at investor rates (not captured at offer creation)';
}

export function OfferFacts({ offer }: { offer: Offer }) {
    return (
        <DetailList
            columns={3}
            items={[
                ...(offer.status === 'live' ? [{ label: 'Public offer link', value: <CopyButton variant="outline" size="sm" value={`${window.location.origin}/offers/${offer.reference}`} /> }] : []),
                { label: "Issuer's registered name", value: offer.issuer_name },
                { label: 'Issuer type', value: offer.issuer_type },
                { label: 'Security type', value: offer.security_type_label },
                { label: 'Issue description & series', value: `${offer.issue_description}${offer.issue_series ? ` (${offer.issue_series})` : ''}`, wide: true },
                { label: 'Offer size', value: `Up to ${formatMoney(offer.offer_size)}` },
                { label: 'Minimum subscription threshold', value: `${Number(offer.min_subscription_threshold)}%` },
                { label: 'Minimum subscription / increments', value: `${formatMoney(offer.min_subscription_amount)} then ${formatMoney(offer.subsequent_increment)}` },
                { label: 'Proposed open date', value: formatDateTime(offer.open_at) },
                { label: 'Proposed close date', value: formatDateTime(offer.close_at) },
                { label: 'Tenor', value: offer.tenor ?? 'Not applicable' },
                { label: 'Day count fraction', value: offer.day_count_fraction },
                { label: 'Price-discovery method', value: offer.price_discovery_label },
                { label: offer.rate_label, value: rateSummary(offer) },
                { label: 'Implied yield', value: formatRate(offer.implied_yield) },
                { label: 'Issue price per unit', value: formatMoney(offer.issue_price, 4) },
                { label: 'Indicative maturity date', value: offer.maturity_date ? formatDate(offer.maturity_date) : null },
                { label: 'Indicative allotment date', value: offer.allotment_date ? formatDate(offer.allotment_date) : null },
                { label: 'Investor universe', value: offer.investor_universe.map((c) => categoryLabel[c]).join(', ') },
                { label: 'Payment account', value: offer.bank_account_number ? `${offer.bank_name} · ${offer.bank_account_name} · ${offer.bank_account_number}` : null, wide: true },
            ]}
        />
    );
}

export function WorkflowTimeline({ actions }: { actions: WorkflowAction[] }) {
    if (actions.length === 0) return <p className="text-muted-foreground text-sm">No approval activity yet.</p>;

    return (
        <ol className="space-y-4">
            {actions.map((a) => {
                const Icon = a.decision === 'rejected' || a.decision === 'cancelled' ? XCircle : a.decision === 'approved' ? CheckCircle2 : Circle;
                const tone = a.decision === 'rejected' || a.decision === 'cancelled' ? 'text-rose-500' : a.decision === 'approved' ? 'text-emerald-500' : 'text-gold';
                return (
                    <li key={a.id} className="flex gap-3 text-sm">
                        <Icon className={`mt-0.5 size-4 shrink-0 ${tone}`} />
                        <div>
                            <p>
                                <span className="font-medium">{stageLabel[a.stage]}</span> {a.decision}
                                {a.subject_type.endsWith('OfferAmendment') ? ' an amendment' : a.subject_type.endsWith('Allotment') ? ' the allotment' : ''}
                                {a.user_name ? ` · ${a.user_name}` : ''}
                            </p>
                            {a.reason && <p className="text-muted-foreground">“{a.reason}”</p>}
                            <p className="text-muted-foreground text-xs">{formatDateTime(a.created_at)}</p>
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}

export function AmendmentList({ amendments, reviewRoute }: { amendments: Amendment[]; reviewRoute?: (a: Amendment) => string | null }) {
    if (amendments.length === 0) return <p className="text-muted-foreground text-sm">No amendments.</p>;

    return (
        <div className="space-y-4">
            {amendments.map((a) => {
                const href = reviewRoute?.(a) ?? null;
                return (
                    <div key={a.id} className="rounded-lg border p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-sm">
                                <StatusBadge map={amendmentStatus} value={a.status} />{' '}
                                <span className="text-muted-foreground ml-2">
                                    {a.requester?.name} · {formatDateTime(a.created_at)}
                                </span>
                            </div>
                            {href && (
                                <div className="flex gap-2">
                                    <DecisionDialog href={href} title="Reject amendment" trigger="Reject" triggerVariant="outline" triggerSize="sm" data={{ approve: false }} reasonField="comment" reasonRequired destructive />
                                    <DecisionDialog
                                        href={href}
                                        title="Approve amendment"
                                        description="The changes apply immediately and every investor with an active bid is notified."
                                        trigger="Approve"
                                        triggerSize="sm"
                                        data={{ approve: true }}
                                        reasonField="comment"
                                        reasonLabel="Note (optional)"
                                    />
                                </div>
                            )}
                        </div>
                        <p className="mt-2 text-sm">
                            <span className="font-medium">Reason:</span> {a.reason}
                        </p>
                        <table className="mt-3 w-full text-sm">
                            <thead className="text-muted-foreground text-left text-xs uppercase">
                                <tr>
                                    <th className="py-1">Field</th>
                                    <th className="py-1">Original</th>
                                    <th className="py-1">Amended</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(a.changes).map(([field, c]) => (
                                    <tr key={field} className="border-t">
                                        <td className="py-1.5 pr-3">{amendableLabels[field] ?? field}</td>
                                        <td className="text-muted-foreground py-1.5 pr-3 line-through">{c.from ?? '—'}</td>
                                        <td className="py-1.5 font-medium">{c.to ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {a.review_comment && <p className="text-muted-foreground mt-2 text-xs">Reviewer: {a.review_comment}</p>}
                    </div>
                );
            })}
        </div>
    );
}

export function DocumentsPanel({ offer, required, canUpload }: { offer: Offer; required: string[]; canUpload: boolean }) {
    const form = useForm<{ document_type: string; file: File | null; visible_to_investors: boolean }>({ document_type: required[0] ?? '', file: null, visible_to_investors: true });
    const docs = offer.documents?.filter((d) => ['offer', 'amendment'].includes(d.category)) ?? [];
    const uploaded = new Set(docs.map((d) => d.document_type));

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(route('tsp.offers.documents.store', offer.id), { forceFormData: true, preserveScroll: true, onSuccess: () => form.reset('file') });
    };

    return (
        <div className="space-y-4">
            {required.length > 0 && (
                <ul className="grid gap-2 sm:grid-cols-2">
                    {required.map((r) => (
                        <li key={r} className={`flex items-center gap-2 text-sm ${uploaded.has(r) ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                            {uploaded.has(r) ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />} {r}
                        </li>
                    ))}
                </ul>
            )}
            <ul className="divide-y rounded-lg border">
                {docs.map((d) => (
                    <li key={d.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                        <FileText className="text-gold size-4 shrink-0" />
                        <a href={d.url} target="_blank" rel="noreferrer" className="flex-1 truncate hover:underline">
                            <span className="font-medium">{d.document_type}</span> <span className="text-muted-foreground">· {d.original_name}</span>
                        </a>
                        <span className="text-muted-foreground hidden text-xs sm:inline">{formatDate(d.created_at)}</span>
                        {canUpload && offer.status !== 'live' && (
                            <Button
                                size="icon"
                                variant="ghost"
                                aria-label={`Remove ${d.document_type}`}
                                onClick={() => router.delete(route('tsp.offers.documents.destroy', [offer.id, d.id]), { preserveScroll: true })}
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        )}
                    </li>
                ))}
                {docs.length === 0 && <li className="text-muted-foreground px-3 py-3 text-sm">No documents uploaded.</li>}
            </ul>
            {canUpload && (
                <form onSubmit={submit} className="grid gap-3 rounded-lg border border-dashed p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                    <div className="grid gap-1.5">
                        <label className="text-sm font-medium" htmlFor="doc-type">
                            Document
                        </label>
                        <input
                            id="doc-type"
                            list="doc-types"
                            value={form.data.document_type}
                            onChange={(e) => form.setData('document_type', e.target.value)}
                            className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                            required
                        />
                        <datalist id="doc-types">
                            {required.map((r) => (
                                <option key={r} value={r} />
                            ))}
                        </datalist>
                    </div>
                    <FileField label="File" file={form.data.file} accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" onChange={(f) => form.setData('file', f)} error={form.errors.file} />
                    <Button type="submit" disabled={!form.data.file || form.processing}>
                        Upload
                    </Button>
                </form>
            )}
        </div>
    );
}

export function PartiesPanel({ offer }: { offer: Offer }) {
    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <div>
                <h3 className="mb-2 text-sm font-semibold">Receiving agents</h3>
                {offer.receiving_agents && offer.receiving_agents.length > 0 ? (
                    <ul className="space-y-2 text-sm">
                        {offer.receiving_agents.map((a) => (
                            <li key={a.id ?? a.name} className="rounded-md border px-3 py-2">
                                <span className="font-medium">{a.name}</span>
                                <span className="text-muted-foreground block text-xs">
                                    {a.bank_name} · {a.bank_account_name} · {a.bank_account_number}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-muted-foreground text-sm">None. Investors pay the sponsor or co-sponsors directly.</p>
                )}
            </div>
            <div>
                <h3 className="mb-2 text-sm font-semibold">Co-sponsors</h3>
                {offer.co_sponsors && offer.co_sponsors.length > 0 ? (
                    <ul className="space-y-2 text-sm">
                        {offer.co_sponsors.map((c) => (
                            <li key={c.id ?? c.institution_id} className="rounded-md border px-3 py-2">
                                <span className="font-medium">{c.institution?.name}</span>
                                <span className="text-muted-foreground block text-xs">
                                    {c.can_view_order_book ? 'Views order book' : 'No order book access'} · {c.can_confirm_payments ? 'Confirms payments' : 'Cannot confirm payments'}
                                    {c.bank_account_number ? ` · ${c.bank_name} ${c.bank_account_number}` : ''}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-muted-foreground text-sm">No co-sponsors.</p>
                )}
            </div>
        </div>
    );
}

export function OfferHistory({ history }: { history: AuditLog[] }) {
    return (
        <ol className="space-y-3">
            {history.map((h) => (
                <li key={h.id} className="border-gold border-l-2 pl-3 text-sm">
                    <p>{h.description}</p>
                    <p className="text-muted-foreground text-xs">
                        {h.actor_name ?? 'System'} · {formatDateTime(h.created_at)}
                    </p>
                </li>
            ))}
            {history.length === 0 && <p className="text-muted-foreground text-sm">No activity yet.</p>}
        </ol>
    );
}

export function ReturnedBanner({ offer }: { offer: Offer }) {
    if (offer.status !== 'returned' || !offer.return_reason) return null;
    return (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
            <strong>Returned for update:</strong> {offer.return_reason}
        </div>
    );
}

export { Section };
