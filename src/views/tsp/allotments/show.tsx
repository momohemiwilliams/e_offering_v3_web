import { SubscriptionMeter } from '@/components/charts';
import { type Column, DataTable } from '@/components/data-table';
import { DecisionDialog } from '@/components/decision-dialog';
import { FileField, MoneyField } from '@/components/form-field';
import InputError from '@/components/input-error';
import { WorkflowTimeline } from '@/components/offers/offer-detail';
import { PageHeader } from '@/components/page-header';
import { Page, Section } from '@/components/section';
import { StatCard } from '@/components/stat-card';
import { StatusBadge, ToneBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { formatCompact, formatDateTime, formatMoney, formatNumber, formatRate, toNumber } from '@/lib/format';
import { allotmentStatus, categoryLabel, subscriptionStatus } from '@/lib/labels';
import { cn } from '@/lib/utils';
import { type Allotment, type Offer, type SharedData, type WorkflowAction } from '@/types';
import { Head, router, useForm, usePage } from '@/lib/app';
import { AlertTriangle, Download, FileText, ListChecks, Send, Truck } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface Item {
    id: number;
    bid_id: number;
    subscribed: string;
    allotted: string;
    units: string;
    released: string;
    filled_pct: string;
    eligible: boolean;
    ineligible_reason: string | null;
    override_amount: string | null;
    override_reason: string | null;
    overrider: string | null;
    bid: {
        id: number;
        reference: string;
        investor_name: string;
        investor_category: string;
        investor_type: string;
        investor_type_label: string;
        rate: string | null;
        amount: string;
        csd_name: string | null;
        csd_account_number: string | null;
        payment_status: string;
        status: string;
        submitted_at: string;
    };
}

interface Props {
    offer: Offer;
    allotment: Allotment | null;
    items: Item[];
    basis: Record<string, { allotted: string; percent: number; investors: number }> | null;
    validationErrors: string[];
    workflow: WorkflowAction[];
    guaranteeClasses: Record<string, string>;
    isOwner: boolean;
    canInitiate: boolean;
}

const COMPONENTS = [
    ['guarantee', 'Guaranteed investors / class (100%)'],
    ['rate', 'Rate-based (final / clearing rate)'],
    ['pro_rata', 'Pro-rata for the remainder'],
    ['fcfs', 'First Come First Served for the remainder'],
];

function OverrideDialog({ item, editable }: { item: Item; editable: boolean }) {
    const [open, setOpen] = useState(false);
    const form = useForm({ amount: item.override_amount ?? item.allotted, reason: item.override_reason ?? '' });
    if (!editable) return null;

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(route('tsp.allotments.override', item.id), { preserveScroll: true, onSuccess: () => setOpen(false) });
    };
    const clear = () => {
        form.transform(() => ({ amount: '', reason: form.data.reason || 'Override removed' }));
        form.post(route('tsp.allotments.override', item.id), { preserveScroll: true, onSuccess: () => setOpen(false) });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="ghost">
                    Override
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={submit} className="space-y-4">
                    <DialogHeader>
                        <DialogTitle>Override allotment · {item.bid.investor_name}</DialogTitle>
                    </DialogHeader>
                    <p className="text-muted-foreground text-sm">
                        Subscribed {formatMoney(item.subscribed)}. Other investors are recalculated automatically after the override.
                    </p>
                    <MoneyField label="Allotted amount" required value={form.data.amount} onChange={(v) => form.setData('amount', v)} error={form.errors.amount} />
                    <div className="grid gap-1.5">
                        <Label htmlFor={`reason-${item.id}`}>
                            Reason <span className="text-destructive">*</span>
                        </Label>
                        <Textarea id={`reason-${item.id}`} rows={3} required value={form.data.reason} onChange={(e) => form.setData('reason', e.target.value)} />
                        <InputError message={form.errors.reason} />
                    </div>
                    {(form.errors as Record<string, string>).allotment && <InputError message={(form.errors as Record<string, string>).allotment} />}
                    <DialogFooter>
                        {item.override_amount !== null && (
                            <Button type="button" variant="outline" onClick={clear}>
                                Remove override
                            </Button>
                        )}
                        <Button type="submit" disabled={form.processing}>
                            Save override
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function MethodForm({ offer, allotment, items, guaranteeClasses, editable }: { offer: Offer; allotment: Allotment; items: Item[]; guaranteeClasses: Record<string, string>; editable: boolean }) {
    const m = allotment.method ?? { method: 'pro_rata' };
    const form = useForm({
        method: m.method ?? 'pro_rata',
        pro_rata_option: String(m.pro_rata_option ?? 3),
        components: (m.components ?? []) as string[],
        shares: (m.shares ?? {}) as Record<string, string | number>,
        guaranteed_bid_ids: (m.guaranteed_bid_ids ?? []) as number[],
        guaranteed_classes: (m.guaranteed_classes ?? []) as string[],
        final_rate: allotment.final_rate ?? '',
    });
    const errors = form.errors as Record<string, string>;
    const needsGuarantee = (form.data.method === 'pro_rata' && form.data.pro_rata_option === '1') || (form.data.method === 'hybrid' && form.data.components.includes('guarantee'));
    const needsRate =
        offer.price_discovery_method !== 'fixed_rate' ||
        (form.data.method === 'pro_rata' && form.data.pro_rata_option === '2') ||
        (form.data.method === 'hybrid' && form.data.components.includes('rate'));
    const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.put(route('tsp.allotments.configure', offer.id), { preserveScroll: true });
    };

    return (
        <form onSubmit={submit} className="space-y-5">
            <fieldset disabled={!editable} className="space-y-5">
                {needsRate && (
                    <div className="max-w-xs">
                        <Label htmlFor="final-rate">
                            Final {offer.rate_label.toLowerCase()}
                            {offer.price_discovery_method !== 'fixed_rate' && <span className="text-destructive"> *</span>}
                        </Label>
                        <Input id="final-rate" type="number" step="0.0001" className="mt-1.5" value={form.data.final_rate} onChange={(e) => form.setData('final_rate', e.target.value)} />
                        <InputError message={errors.final_rate} />
                    </div>
                )}
                <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Allotment methodology">
                    {[
                        ['fcfs', 'First Come First Served', 'In the order bids were received, stopping at the bid that would exceed the issue size.'],
                        ['pro_rata', 'Pro-Rata', 'Option 1, 2 or 3 below, with the minimum subscription rule.'],
                        ['hybrid', 'Hybrid', 'Combine two or more methodology options.'],
                    ].map(([key, label, hint]) => (
                        <button
                            type="button"
                            key={key}
                            role="radio"
                            aria-checked={form.data.method === key}
                            onClick={() => form.setData('method', key)}
                            className={cn('rounded-lg border p-3 text-left text-sm', form.data.method === key ? 'border-navy bg-navy/5' : 'hover:border-navy/40')}
                        >
                            <span className="font-medium">{label}</span>
                            <span className="text-muted-foreground mt-1 block text-xs">{hint}</span>
                        </button>
                    ))}
                </div>

                {form.data.method === 'pro_rata' && (
                    <div className="grid gap-2 sm:grid-cols-3">
                        {[
                            ['1', 'Option 1', 'Selected investor(s) / investor class guaranteed 100%; the rest pro-rata.'],
                            ['2', 'Option 2', 'Rate-based: below the final rate 100%, at the rate pro-rata, above it nothing.'],
                            ['3', 'Option 3', 'All investors subject to pro-rata.'],
                        ].map(([v, label, hint]) => (
                            <label key={v} className={cn('flex cursor-pointer gap-2 rounded-lg border p-3 text-sm', form.data.pro_rata_option === v && 'border-gold bg-gold/10')}>
                                <input type="radio" name="opt" className="mt-1" checked={form.data.pro_rata_option === v} onChange={() => form.setData('pro_rata_option', v)} />
                                <span>
                                    <span className="font-medium">{label}</span>
                                    <span className="text-muted-foreground block text-xs">{hint}</span>
                                </span>
                            </label>
                        ))}
                    </div>
                )}

                {form.data.method === 'hybrid' && (
                    <div className="grid gap-2 sm:grid-cols-2">
                        {COMPONENTS.map(([key, label]) => (
                            <label key={key} className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                                <Checkbox checked={form.data.components.includes(key)} onCheckedChange={() => form.setData('components', toggle(form.data.components, key))} /> {label}
                            </label>
                        ))}
                        {form.data.components.length >= 2 && (
                            <div className="space-y-2 rounded-lg border p-3 sm:col-span-2">
                                <p className="text-sm font-medium">Share of the issue for each method (optional)</p>
                                <p className="text-muted-foreground text-xs">Methods run in the order you ticked them. Any share not used rolls into the next method. Leave all blank to run them one after another with no limits.</p>
                                {form.data.components.map((key, index) => (
                                    <div key={key} className="flex items-center gap-3 text-sm">
                                        <span className="flex-1">{index + 1}. {COMPONENTS.find(([k]) => k === key)?.[1]}</span>
                                        <Input
                                            className="w-24 text-right"
                                            inputMode="decimal"
                                            aria-label={'Share for method ' + (index + 1) + ', percent'}
                                            value={form.data.shares[key] ?? ''}
                                            onChange={(e) => form.setData('shares', { ...form.data.shares, [key]: e.target.value.replace(/[^\d.]/g, '') })}
                                        />
                                        <span>%</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        <InputError message={errors.method ?? errors.components} className="sm:col-span-2" />
                    </div>
                )}

                {needsGuarantee && (
                    <div className="grid gap-4 rounded-lg border p-4 lg:grid-cols-2">
                        <div>
                            <p className="mb-2 text-sm font-medium">Guaranteed investor classes</p>
                            <div className="grid gap-1.5">
                                {Object.entries(guaranteeClasses).map(([k, v]) => (
                                    <label key={k} className="flex items-center gap-2 text-sm">
                                        <Checkbox checked={form.data.guaranteed_classes.includes(k)} onCheckedChange={() => form.setData('guaranteed_classes', toggle(form.data.guaranteed_classes, k))} /> {v}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="mb-2 text-sm font-medium">Or selected investors</p>
                            <div className="max-h-56 space-y-1.5 overflow-y-auto pr-2">
                                {items
                                    .filter((i) => i.eligible)
                                    .map((i) => (
                                        <label key={i.bid_id} className="flex items-center gap-2 text-sm">
                                            <Checkbox checked={form.data.guaranteed_bid_ids.includes(i.bid_id)} onCheckedChange={() => form.setData('guaranteed_bid_ids', toggle(form.data.guaranteed_bid_ids, i.bid_id))} />
                                            <span className="truncate">
                                                {i.bid.investor_name} <span className="text-muted-foreground">· {formatMoney(i.subscribed, 0)}</span>
                                            </span>
                                        </label>
                                    ))}
                            </div>
                        </div>
                    </div>
                )}
                <InputError message={errors.method} />
            </fieldset>
            {editable && (
                <Button type="submit" disabled={form.processing}>
                    <ListChecks className="size-4" /> Apply methodology and recalculate
                </Button>
            )}
        </form>
    );
}

function SecDocuments({ offer, allotment, editable }: { offer: Offer; allotment: Allotment; editable: boolean }) {
    const form = useForm<{ document_type: string; file: File | null }>({ document_type: 'Letter from Sponsor', file: null });
    const docs = allotment.documents?.filter((d) => d.category !== 'lodgement') ?? [];

    return (
        <div className="space-y-3">
            <ul className="divide-y rounded-lg border">
                {docs.map((d) => (
                    <li key={d.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                        <FileText className="text-gold size-4" />
                        <a href={d.url} target="_blank" rel="noreferrer" className="flex-1 truncate hover:underline">
                            <span className="font-medium">{d.document_type}</span> · {d.original_name}
                        </a>
                    </li>
                ))}
                {docs.length === 0 && <li className="text-muted-foreground px-3 py-3 text-sm">No documents attached. Attach the Letter from Sponsor for SEC.</li>}
            </ul>
            {editable && (
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.post(route('tsp.allotments.documents', offer.id), { forceFormData: true, preserveScroll: true, onSuccess: () => form.reset('file') });
                    }}
                    className="grid gap-3 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end"
                >
                    <select value={form.data.document_type} onChange={(e) => form.setData('document_type', e.target.value)} aria-label="Document type" className="border-input bg-background h-9 rounded-md border px-2 text-sm">
                        <option>Letter from Sponsor</option>
                        <option>Supporting Document</option>
                    </select>
                    <FileField label="File" file={form.data.file} accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" onChange={(f) => form.setData('file', f)} error={form.errors.file} />
                    <Button type="submit" variant="outline" disabled={!form.data.file || form.processing}>
                        Attach
                    </Button>
                </form>
            )}
        </div>
    );
}

export default function AllotmentShow({ offer, allotment, items, basis, validationErrors, workflow, guaranteeClasses, isOwner, canInitiate }: Props) {
    const { auth } = usePage<SharedData>().props;
    const inputter = isOwner && auth.user.access_level === 'inputter';
    const authoriser = isOwner && auth.user.access_level === 'authoriser';
    const editable = !!allotment && ['draft', 'returned', 'sec_rejected'].includes(allotment.status);
    const suffix = offer.security_type === 'equities' || offer.security_type === 'depository_receipts' ? '' : '%';
    const released = items.reduce((s, i) => s + toNumber(i.released), 0);

    const breadcrumbs = [
        { title: 'Allotment', href: route('tsp.allotments.index') },
        { title: offer.reference, href: route('tsp.allotments.show', offer.id) },
    ];

    if (!allotment) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={`Allotment · ${offer.reference}`} />
                <Page>
                    <PageHeader title={offer.issuer_name} description={`${offer.reference} · closes ${formatDateTime(offer.close_at)}`} />
                    <Section>
                        <div className="flex flex-col items-center gap-3 py-10 text-center">
                            <ListChecks className="text-gold size-10" />
                            <p className="font-medium">Allotment has not been initiated.</p>
                            <p className="text-muted-foreground max-w-md text-sm">
                                Once the offer closes, initiate allotment from the order book. Offer details can be amended until then.
                            </p>
                            {canInitiate && (
                                <Button onClick={() => router.post(route('tsp.allotments.initiate', offer.id))}>
                                    <ListChecks className="size-4" /> Initiate allotment
                                </Button>
                            )}
                        </div>
                    </Section>
                </Page>
            </AppLayout>
        );
    }

    const columns: Column<Item>[] = [
        {
            key: 'investor',
            header: 'Investor',
            value: (i) => i.bid.investor_name,
            cell: (i) => (
                <div>
                    <span className="font-medium">{i.bid.investor_name}</span>
                    <span className="text-muted-foreground block text-xs">
                        {categoryLabel[i.bid.investor_category]} · {i.bid.investor_type_label}
                    </span>
                    {!i.eligible && <ToneBadge tone="danger">{i.ineligible_reason}</ToneBadge>}
                    {i.override_amount !== null && (
                        <p className="text-gold mt-1 text-[11px]">
                            Override by {i.overrider}: {i.override_reason}
                        </p>
                    )}
                </div>
            ),
        },
        { key: 'rate', header: 'Bid rate', align: 'right', value: (i) => toNumber(i.bid.rate), cell: (i) => formatRate(i.bid.rate, suffix) },
        { key: 'sub', header: 'Subscribed', align: 'right', value: (i) => toNumber(i.subscribed), cell: (i) => formatMoney(i.subscribed) },
        { key: 'allotted', header: 'Allotted', align: 'right', value: (i) => toNumber(i.allotted), cell: (i) => <span className="font-semibold">{formatMoney(i.allotted)}</span> },
        { key: 'units', header: 'Units', align: 'right', value: (i) => toNumber(i.units), cell: (i) => formatNumber(i.units, 2) },
        { key: 'released', header: 'Released', align: 'right', value: (i) => toNumber(i.released), cell: (i) => formatMoney(i.released) },
        { key: 'pct', header: '% filled', align: 'right', value: (i) => toNumber(i.filled_pct), cell: (i) => `${Number(i.filled_pct)}%` },
        { key: 'csd', header: 'CSD', value: (i) => i.bid.csd_account_number, cell: (i) => <span className="text-xs">{`${i.bid.csd_name ?? ''} ${i.bid.csd_account_number ?? ''}`}</span> },
        { key: 'act', header: '', sortable: false, cell: (i) => (i.eligible ? <OverrideDialog item={i} editable={inputter && editable} /> : null) },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Allotment · ${offer.reference}`} />
            <Page>
                <PageHeader
                    title={offer.issuer_name}
                    description={
                        <span className="flex flex-wrap items-center gap-2">
                            {offer.reference} · {allotment.method_label} <StatusBadge map={allotmentStatus} value={allotment.status} />
                        </span>
                    }
                    actions={
                        <>
                            <Button variant="outline" asChild>
                                <a href={route('tsp.allotments.export', { offer: offer.id, format: 'xlsx' })}>
                                    <Download className="size-4" /> Allotment schedule
                                </a>
                            </Button>
                            {allotment.status === 'lodged' && (
                                <Button variant="outline" asChild>
                                    <a href={route('tsp.allotments.export', { offer: offer.id, type: 'lodgement', format: 'xlsx' })}>
                                        <Download className="size-4" /> Lodgement summary
                                    </a>
                                </Button>
                            )}
                            {inputter && editable && (
                                <DecisionDialog
                                    href={route('tsp.allotments.submit', offer.id)}
                                    title="Submit allotment for approval"
                                    description={
                                        validationErrors.length > 0
                                            ? `Fix first: ${validationErrors.join(' ')}`
                                            : allotment.subscription_status === 'below_minimum'
                                              ? 'Subscription is below the minimum threshold. Submitting continues with the allotment.'
                                              : 'Your Authoriser reviews the method, final rate and the full schedule.'
                                    }
                                    data={{ continue_below_minimum: allotment.subscription_status === 'below_minimum' }}
                                    trigger={
                                        <>
                                            <Send className="size-4" /> Submit for approval
                                        </>
                                    }
                                    confirmLabel="Submit"
                                />
                            )}
                            {authoriser && allotment.status === 'pending_authorisation' && (
                                <>
                                    <DecisionDialog
                                        href={route('tsp.allotments.authorise', offer.id)}
                                        title="Return allotment to the Inputter"
                                        trigger="Return"
                                        triggerVariant="outline"
                                        data={{ approve: false }}
                                        reasonField="reason"
                                        reasonRequired
                                        destructive
                                    />
                                    <DecisionDialog
                                        href={route('tsp.allotments.authorise', offer.id)}
                                        title="Approve and send to SEC"
                                        description="The schedule and attached documents go to SEC with the status SEC Pending."
                                        trigger="Approve"
                                        data={{ approve: true }}
                                        reasonField="reason"
                                        reasonLabel="Note (optional)"
                                    />
                                </>
                            )}
                            {inputter && allotment.status === 'approved' && (
                                <DecisionDialog
                                    href={route('tsp.allotments.lodge', offer.id)}
                                    title="Initiate lodgement"
                                    description="The lodgement report is transmitted to the CSD; both you and the CSD can download the summary."
                                    trigger={
                                        <>
                                            <Truck className="size-4" /> Initiate lodgement
                                        </>
                                    }
                                    confirmLabel="Transmit to CSD"
                                />
                            )}
                        </>
                    }
                />

                {allotment.status === 'returned' && allotment.return_reason && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
                        <strong>Returned by the TSP Authoriser:</strong> {allotment.return_reason}
                    </div>
                )}
                {allotment.status === 'sec_rejected' && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
                        <strong>Rejected by SEC:</strong> {allotment.sec_reason}. Update the order book and allotment schedule, then resubmit.
                    </div>
                )}
                {allotment.status === 'lodged' && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                        Lodged with the CSD on {formatDateTime(allotment.lodged_at)} · reference <span className="font-mono">{allotment.lodgement_reference}</span> ({allotment.lodgement_status}).
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <StatCard variant="navy" label="Approved issue size" value={formatCompact(toNumber(allotment.issue_size))} hint={formatMoney(allotment.issue_size)} />
                    <StatCard variant="gold" label="Total valid demand" value={formatCompact(toNumber(allotment.valid_demand))} hint={`Total demand ${formatMoney(allotment.total_demand, 0)}`} />
                    <StatCard variant="navy" label="Total allotted" value={formatCompact(toNumber(allotment.total_allotted))} hint={formatMoney(allotment.total_allotted)} />
                    <StatCard variant="gold" label="Total released" value={formatCompact(released)} hint={formatMoney(released)} />
                    <StatCard variant="navy" label="Final rate" value={formatRate(allotment.final_rate, suffix)} hint={offer.price_discovery_label} />
                </div>

                <div className="grid gap-6 xl:grid-cols-3">
                    <Section title="Subscription level" description="Total valid demand against the approved issue size.">
                        <div className="space-y-3">
                            <div className="flex items-end justify-between">
                                <span className="text-navy text-4xl font-semibold dark:text-white">{Number(allotment.subscription_level)}%</span>
                                <StatusBadge map={subscriptionStatus} value={allotment.subscription_status} />
                            </div>
                            <SubscriptionMeter level={Number(allotment.subscription_level)} />
                            {allotment.subscription_status === 'below_minimum' && (
                                <div className="space-y-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
                                    <p className="flex items-center gap-2 font-medium">
                                        <AlertTriangle className="size-4" /> Below the {Number(offer.min_subscription_threshold)}% minimum threshold
                                    </p>
                                    <p>Cancel the offer, or continue with the subscribed amount by submitting the allotment.</p>
                                    {inputter && editable && (
                                        <DecisionDialog
                                            href={route('tsp.allotments.cancel', offer.id)}
                                            title="Cancel the offer"
                                            description="Investors with active bids are notified. This cannot be undone."
                                            trigger="Cancel offer"
                                            triggerVariant="destructive"
                                            triggerSize="sm"
                                            reasonField="reason"
                                            reasonRequired
                                            destructive
                                            confirmLabel="Cancel offer"
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    </Section>
                    <Section title="Allotment methodology" className="xl:col-span-2" description={editable ? 'You can change the method until you submit.' : allotment.method_label}>
                        <MethodForm offer={offer} allotment={allotment} items={items} guaranteeClasses={guaranteeClasses} editable={inputter && editable} />
                    </Section>
                </div>

                {(validationErrors.length > 0 || (allotment.notes ?? []).length > 0) && (
                    <div className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                        <p className="font-medium">Final validation</p>
                        {[...validationErrors, ...(allotment.notes ?? [])].map((e) => (
                            <p key={e}>• {e}</p>
                        ))}
                    </div>
                )}

                <Section title="Per-investor allotment" description="Amount subscribed, allotted, units, released and % filled for every bid." flush>
                    <DataTable rows={items} rowKey={(i) => i.id} searchable searchPlaceholder="Search investor" columns={columns} rowClassName={(i) => (!i.eligible ? 'opacity-60' : undefined)} />
                </Section>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Section title="Basis of allotment">
                        {basis && (
                            <ul className="space-y-3 text-sm">
                                {Object.entries(basis).map(([k, b]) => (
                                    <li key={k}>
                                        <div className="flex justify-between">
                                            <span>{categoryLabel[k]}</span>
                                            <span className="tabular-nums">
                                                {b.percent}% · {formatMoney(b.allotted, 0)}
                                            </span>
                                        </div>
                                        <div className="bg-muted mt-1 h-2 rounded-full">
                                            <div className="bg-navy h-2 rounded-full" style={{ width: `${b.percent}%` }} />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Section>
                    <Section title="Documents for SEC review">
                        <SecDocuments offer={offer} allotment={allotment} editable={inputter && (editable || allotment.status === 'pending_authorisation')} />
                    </Section>
                    <Section title="Approval workflow">
                        <WorkflowTimeline actions={workflow} />
                    </Section>
                </div>
            </Page>
        </AppLayout>
    );
}
