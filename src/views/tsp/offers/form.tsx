import { Field, MoneyField, SelectField, TextField } from '@/components/form-field';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/page-header';
import { Page, Section } from '@/components/section';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { toInputDateTime, toPickerValue } from '@/lib/format';
import { postJson } from '@/lib/http';
import { cn } from '@/lib/utils';
import { type CoSponsor, type InvestorCategory, type Offer, type ReceivingAgent } from '@/types';
import { Head, Link, useForm } from '@/lib/app';
import { Download, LoaderCircle, Plus, Trash2, Upload } from 'lucide-react';
import { FormEvent, useRef, useState } from 'react';

interface SecurityType {
    label: string;
    universe: InvestorCategory[];
    has_tenor: boolean;
    documents: string[];
}

interface Props {
    offer: (Offer & { receiving_agents: ReceivingAgent[]; co_sponsors: CoSponsor[] }) | null;
    options: {
        issuerTypes: string[];
        securityTypes: Record<string, SecurityType>;
        methods: Record<string, string>;
        dayCounts: string[];
        categories: Record<InvestorCategory, string>;
    };
    sponsors: { id: number; name: string }[];
    defaults: { bank_name: string | null; bank_account_name: string | null; bank_account_number: string | null };
}

const rateLabel = (type: string) =>
    ({ equities: 'Share price', depository_receipts: 'Share price', commercial_papers: 'Discount rate', non_interest: 'Rental / profit-sharing rate' })[type] ?? 'Coupon rate';

const dateOnly = (v: string | null | undefined) => (v ? v.slice(0, 10) : '');

/** CR s4.1-4.3: offer details, price-discovery parameters, receiving agents and co-sponsors. */
export default function OfferForm({ offer, options, sponsors, defaults }: Props) {
    const editing = offer !== null;
    const form = useForm({
        issuer_name: offer?.issuer_name ?? '',
        issue_description: offer?.issue_description ?? '',
        issue_series: offer?.issue_series ?? '',
        offer_size: offer?.offer_size ?? '',
        min_subscription_threshold: offer?.min_subscription_threshold ?? '50',
        issuer_type: offer?.issuer_type ?? '',
        security_type: offer?.security_type ?? '',
        open_at: toInputDateTime(offer?.open_at),
        close_at: toInputDateTime(offer?.close_at),
        min_subscription_amount: offer?.min_subscription_amount ?? '',
        subsequent_increment: offer?.subsequent_increment ?? '',
        tenor: offer?.tenor ?? '',
        day_count_fraction: offer?.day_count_fraction ?? '',
        price_discovery_method: offer?.price_discovery_method ?? '',
        investor_universe: (offer?.investor_universe ?? []) as InvestorCategory[],
        rate: offer?.rate ?? '',
        rate_min: offer?.rate_min ?? '',
        rate_max: offer?.rate_max ?? '',
        implied_yield: offer?.implied_yield ?? '',
        issue_price: offer?.issue_price ?? '',
        maturity_date: dateOnly(offer?.maturity_date),
        allotment_date: dateOnly(offer?.allotment_date),
        bank_name: offer?.bank_name ?? defaults.bank_name ?? '',
        bank_account_name: offer?.bank_account_name ?? defaults.bank_account_name ?? '',
        bank_account_number: offer?.bank_account_number ?? defaults.bank_account_number ?? '',
        uses_receiving_agents: offer?.uses_receiving_agents ?? false,
        receiving_agents: (offer?.receiving_agents ?? []).map((a) => ({
            name: a.name,
            bank_name: a.bank_name ?? '',
            bank_account_name: a.bank_account_name,
            bank_account_number: a.bank_account_number,
        })),
        co_sponsors: (offer?.co_sponsors ?? []).map((c) => ({
            institution_id: c.institution_id,
            can_view_order_book: c.can_view_order_book,
            can_confirm_payments: c.can_confirm_payments,
            bank_name: c.bank_name ?? '',
            bank_account_name: c.bank_account_name ?? '',
            bank_account_number: c.bank_account_number ?? '',
        })),
    });
    const errors = form.errors as Record<string, string>;
    const type = options.securityTypes[form.data.security_type];
    const method = form.data.price_discovery_method;
    const fileRef = useRef<HTMLInputElement>(null);
    const [importing, setImporting] = useState(false);
    const [importErrors, setImportErrors] = useState<string[]>([]);

    const chooseType = (key: string) => {
        const allowed = options.securityTypes[key].universe;
        form.setData((d) => ({
            ...d,
            security_type: key,
            investor_universe: d.investor_universe.length ? d.investor_universe.filter((u) => allowed.includes(u)) : allowed,
            tenor: options.securityTypes[key].has_tenor ? d.tenor : '',
        }));
    };

    const toggleUniverse = (c: InvestorCategory) =>
        form.setData('investor_universe', form.data.investor_universe.includes(c) ? form.data.investor_universe.filter((x) => x !== c) : [...form.data.investor_universe, c]);

    const setAgent = (i: number, patch: Partial<(typeof form.data.receiving_agents)[number]>) =>
        form.setData('receiving_agents', form.data.receiving_agents.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
    const setCo = (i: number, patch: Partial<(typeof form.data.co_sponsors)[number]>) =>
        form.setData('co_sponsors', form.data.co_sponsors.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

    const importAgents = async (file: File) => {
        setImporting(true);
        setImportErrors([]);
        try {
            const body = new FormData();
            body.append('file', file);
            const res = await postJson<{ rows: { name: string; bank_name: string; bank_account_name: string; bank_account_number: string }[]; errors: string[] }>(
                route('tsp.offers.agents-import'),
                body,
            );
            form.setData((d) => ({ ...d, uses_receiving_agents: true, receiving_agents: [...d.receiving_agents, ...res.rows] }));
            setImportErrors(res.errors);
        } catch (e) {
            setImportErrors([e instanceof Error ? e.message : 'The file could not be read.']);
        } finally {
            setImporting(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (editing) form.put(route('tsp.offers.update', offer!.id));
        else form.post(route('tsp.offers.store'));
    };

    const errorCount = Object.keys(errors).length;

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Offers', href: route('tsp.offers.index') },
                editing ? { title: offer!.reference, href: route('tsp.offers.show', offer!.id) } : { title: 'Create offer', href: route('tsp.offers.create') },
            ]}
        >
            <Head title={editing ? 'Edit offer' : 'Create offer'} />
            <Page className="max-w-5xl">
                <PageHeader
                    title={editing ? `Edit ${offer!.reference}` : 'Create offer'}
                    description="Saved as a draft. Upload the supporting documents next, then submit it to your Authoriser."
                />
                {errorCount > 0 && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
                        Please correct the {errorCount} highlighted field{errorCount > 1 ? 's' : ''} below.
                    </div>
                )}
                <form onSubmit={submit} className="space-y-6">
                    <Section title="1. Issuer and security">
                        <div className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <TextField label="Issuer's registered name" required value={form.data.issuer_name} onChange={(v) => form.setData('issuer_name', v)} error={errors.issuer_name} />
                                <SelectField
                                    label="Issuer type"
                                    required
                                    value={form.data.issuer_type}
                                    onChange={(v) => form.setData('issuer_type', v)}
                                    options={options.issuerTypes.map((t) => ({ value: t, label: t }))}
                                    error={errors.issuer_type}
                                />
                            </div>
                            <Field label="Security type" required error={errors.security_type}>
                                <div className="grid gap-2 sm:grid-cols-3" role="radiogroup">
                                    {Object.entries(options.securityTypes).map(([key, t]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            role="radio"
                                            aria-checked={form.data.security_type === key}
                                            onClick={() => chooseType(key)}
                                            className={cn(
                                                'rounded-lg border px-3 py-2.5 text-left text-sm transition',
                                                form.data.security_type === key ? 'border-navy bg-navy/5 text-navy font-medium dark:text-white' : 'hover:border-navy/40',
                                            )}
                                        >
                                            {t.label}
                                            {key === 'depository_receipts' && <span className="text-gold ml-1 text-xs">New</span>}
                                        </button>
                                    ))}
                                </div>
                            </Field>
                            <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                                <Field label="Issue description" required error={errors.issue_description}>
                                    <Textarea rows={2} value={form.data.issue_description} onChange={(e) => form.setData('issue_description', e.target.value)} />
                                </Field>
                                <TextField label="Issue series" value={form.data.issue_series} onChange={(v) => form.setData('issue_series', v)} error={errors.issue_series} />
                            </div>
                        </div>
                    </Section>

                    <Section title="2. Offer terms">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <MoneyField label="Offer size" prefix="Up to ₦" required value={form.data.offer_size} onChange={(v) => form.setData('offer_size', v)} error={errors.offer_size} className="[&_input]:pl-16" />
                            <TextField
                                label="Minimum subscription threshold (%)"
                                type="number"
                                min={0}
                                max={100}
                                step="0.01"
                                required
                                value={form.data.min_subscription_threshold}
                                onChange={(v) => form.setData('min_subscription_threshold', v)}
                                error={errors.min_subscription_threshold}
                                hint="Below this subscription level you may cancel the offer at allotment."
                            />
                            <MoneyField label="Minimum subscription amount" required value={form.data.min_subscription_amount} onChange={(v) => form.setData('min_subscription_amount', v)} error={errors.min_subscription_amount} />
                            <MoneyField label="Subsequent increments" required value={form.data.subsequent_increment} onChange={(v) => form.setData('subsequent_increment', v)} error={errors.subsequent_increment} hint="Use 0 for any amount above the minimum." />
                            <Field label="Proposed offer open date" required error={errors.open_at}>
                                <DateTimePicker value={form.data.open_at} onChange={(v) => form.setData('open_at', v)} min={editing ? undefined : toPickerValue(new Date())} />
                            </Field>
                            <Field label="Proposed offer close date" required error={errors.close_at}>
                                <DateTimePicker value={form.data.close_at} onChange={(v) => form.setData('close_at', v)} min={form.data.open_at || undefined} />
                            </Field>
                            {(type?.has_tenor ?? true) ? (
                                <TextField label="Tenor" required value={form.data.tenor} onChange={(v) => form.setData('tenor', v)} error={errors.tenor} placeholder="e.g. 270 days, 5 years" />
                            ) : (
                                <Field label="Tenor">
                                    <p className="text-muted-foreground py-2 text-sm">Not applicable for {type?.label}.</p>
                                </Field>
                            )}
                            <SelectField
                                label="Day count fraction"
                                value={form.data.day_count_fraction}
                                onChange={(v) => form.setData('day_count_fraction', v)}
                                options={options.dayCounts.map((d) => ({ value: d, label: d }))}
                                placeholder="Optional"
                                error={errors.day_count_fraction}
                            />
                        </div>
                    </Section>

                    <Section title="3. Price discovery" description="Fields differ slightly by method (CR s4.3).">
                        <div className="space-y-4">
                            <Field label="Price-discovery method" required error={errors.price_discovery_method}>
                                <div className="grid gap-2 sm:grid-cols-3" role="radiogroup">
                                    {Object.entries(options.methods).map(([key, label]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            role="radio"
                                            aria-checked={method === key}
                                            onClick={() => form.setData('price_discovery_method', key as Offer['price_discovery_method'])}
                                            className={cn(
                                                'rounded-lg border px-3 py-2.5 text-left text-sm transition',
                                                method === key ? 'border-navy bg-navy/5 text-navy font-medium dark:text-white' : 'hover:border-navy/40',
                                            )}
                                        >
                                            {label}
                                            {key === 'book_building' && <span className="text-gold ml-1 text-xs">New</span>}
                                        </button>
                                    ))}
                                </div>
                            </Field>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {method === 'fixed_rate' && (
                                    <TextField label={rateLabel(form.data.security_type)} type="number" step="0.0001" required value={form.data.rate} onChange={(v) => form.setData('rate', v)} error={errors.rate} />
                                )}
                                {method === 'competitive' && (
                                    <Field label={rateLabel(form.data.security_type)}>
                                        <p className="text-muted-foreground py-2 text-sm">Not captured now; investors bid their rates and you enter the final rate at allotment.</p>
                                    </Field>
                                )}
                                {method === 'book_building' && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <TextField label={`${rateLabel(form.data.security_type)} – minimum`} type="number" step="0.0001" required value={form.data.rate_min} onChange={(v) => form.setData('rate_min', v)} error={errors.rate_min} />
                                        <TextField label="Maximum" type="number" step="0.0001" required value={form.data.rate_max} onChange={(v) => form.setData('rate_max', v)} error={errors.rate_max} />
                                    </div>
                                )}
                                <TextField label="Implied yield (%)" type="number" step="0.0001" required value={form.data.implied_yield} onChange={(v) => form.setData('implied_yield', v)} error={errors.implied_yield} />
                                <MoneyField label="Issue price per unit" required value={form.data.issue_price} onChange={(v) => form.setData('issue_price', v)} error={errors.issue_price} />
                                {(type?.has_tenor ?? true) && (
                                    <TextField label="Indicative maturity date" type="date" required value={form.data.maturity_date} onChange={(v) => form.setData('maturity_date', v)} error={errors.maturity_date} />
                                )}
                                <TextField label="Indicative allotment date" type="date" required value={form.data.allotment_date} onChange={(v) => form.setData('allotment_date', v)} error={errors.allotment_date} />
                            </div>
                        </div>
                    </Section>

                    <Section title="4. Investor universe" description={type ? `Pre-filtered for ${type.label}.` : 'Choose a security type first.'}>
                        <div className="flex flex-wrap gap-3">
                            {(type?.universe ?? []).map((c) => (
                                <label key={c} className={cn('flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm', form.data.investor_universe.includes(c) && 'border-navy bg-navy/5')}>
                                    <Checkbox checked={form.data.investor_universe.includes(c)} onCheckedChange={() => toggleUniverse(c)} />
                                    {options.categories[c]}
                                </label>
                            ))}
                        </div>
                        <InputError message={errors.investor_universe ?? errors['investor_universe.0']} className="mt-2" />
                    </Section>

                    <Section title="5. Payment, receiving agents and co-sponsors" description="Investors pay the receiving agent or co-sponsor they choose, or the main sponsor account below.">
                        <div className="space-y-6">
                            <div className="grid gap-4 sm:grid-cols-3">
                                <TextField label="Bank name" required value={form.data.bank_name} onChange={(v) => form.setData('bank_name', v)} error={errors.bank_name} />
                                <TextField label="Account name" required value={form.data.bank_account_name} onChange={(v) => form.setData('bank_account_name', v)} error={errors.bank_account_name} />
                                <TextField
                                    label="Account number"
                                    required
                                    inputMode="numeric"
                                    maxLength={10}
                                    value={form.data.bank_account_number}
                                    onChange={(v) => form.setData('bank_account_number', v.replace(/\D/g, ''))}
                                    error={errors.bank_account_number}
                                />
                            </div>

                            <div className="rounded-lg border p-4">
                                <label className="flex items-center gap-2 text-sm font-medium">
                                    <Checkbox checked={form.data.uses_receiving_agents} onCheckedChange={(v) => form.setData('uses_receiving_agents', v === true)} />
                                    This offer uses receiving agents
                                </label>
                                {form.data.uses_receiving_agents && (
                                    <div className="mt-4 space-y-3">
                                        <div className="flex flex-wrap gap-2">
                                            <Button type="button" variant="outline" size="sm" asChild>
                                                <a href={route('tsp.offers.agents-template')}>
                                                    <Download className="size-4" /> Excel template
                                                </a>
                                            </Button>
                                            <Button type="button" variant="outline" size="sm" disabled={importing} onClick={() => fileRef.current?.click()}>
                                                {importing ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />} Import from Excel
                                            </Button>
                                            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="sr-only" onChange={(e) => e.target.files?.[0] && importAgents(e.target.files[0])} />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => form.setData('receiving_agents', [...form.data.receiving_agents, { name: '', bank_name: '', bank_account_name: '', bank_account_number: '' }])}
                                            >
                                                <Plus className="size-4" /> Add agent
                                            </Button>
                                        </div>
                                        {importErrors.length > 0 && (
                                            <ul className="rounded-md bg-amber-50 p-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                                                {importErrors.map((e) => (
                                                    <li key={e}>{e}</li>
                                                ))}
                                            </ul>
                                        )}
                                        {form.data.receiving_agents.map((a, i) => (
                                            <div key={i} className="grid gap-2 sm:grid-cols-[1.3fr_1fr_1.3fr_0.9fr_auto]">
                                                <Input placeholder="Agent name" value={a.name} onChange={(e) => setAgent(i, { name: e.target.value })} aria-label="Agent name" />
                                                <Input placeholder="Bank" value={a.bank_name} onChange={(e) => setAgent(i, { bank_name: e.target.value })} aria-label="Bank" />
                                                <Input placeholder="Account name" value={a.bank_account_name} onChange={(e) => setAgent(i, { bank_account_name: e.target.value })} aria-label="Account name" />
                                                <Input
                                                    placeholder="Account no."
                                                    inputMode="numeric"
                                                    maxLength={10}
                                                    value={a.bank_account_number}
                                                    onChange={(e) => setAgent(i, { bank_account_number: e.target.value.replace(/\D/g, '') })}
                                                    aria-label="Account number"
                                                />
                                                <Button type="button" variant="ghost" size="icon" aria-label="Remove agent" onClick={() => form.setData('receiving_agents', form.data.receiving_agents.filter((_, idx) => idx !== i))}>
                                                    <Trash2 className="size-4" />
                                                </Button>
                                                {(errors[`receiving_agents.${i}.name`] || errors[`receiving_agents.${i}.bank_account_number`] || errors[`receiving_agents.${i}.bank_account_name`]) && (
                                                    <InputError
                                                        className="sm:col-span-5"
                                                        message={errors[`receiving_agents.${i}.name`] ?? errors[`receiving_agents.${i}.bank_account_name`] ?? errors[`receiving_agents.${i}.bank_account_number`]}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                        <InputError message={errors.receiving_agents} />
                                    </div>
                                )}
                            </div>

                            <div className="rounded-lg border p-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium">Co-sponsors and their access</p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={sponsors.length === 0}
                                        onClick={() =>
                                            form.setData('co_sponsors', [
                                                ...form.data.co_sponsors,
                                                { institution_id: 0, can_view_order_book: true, can_confirm_payments: false, bank_name: '', bank_account_name: '', bank_account_number: '' },
                                            ])
                                        }
                                    >
                                        <Plus className="size-4" /> Add co-sponsor
                                    </Button>
                                </div>
                                {form.data.co_sponsors.length === 0 && <p className="text-muted-foreground mt-2 text-sm">No co-sponsors.</p>}
                                <div className="mt-3 space-y-3">
                                    {form.data.co_sponsors.map((c, i) => (
                                        <div key={i} className="space-y-2 rounded-md border p-3">
                                            <div className="flex gap-2">
                                                <select
                                                    value={c.institution_id || ''}
                                                    onChange={(e) => setCo(i, { institution_id: Number(e.target.value) })}
                                                    aria-label="Co-sponsor"
                                                    className="border-input bg-background h-9 flex-1 rounded-md border px-2 text-sm"
                                                >
                                                    <option value="">Select a TSP/RM…</option>
                                                    {sponsors.map((s) => (
                                                        <option key={s.id} value={s.id}>
                                                            {s.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <Button type="button" variant="ghost" size="icon" aria-label="Remove co-sponsor" onClick={() => form.setData('co_sponsors', form.data.co_sponsors.filter((_, idx) => idx !== i))}>
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                            <InputError message={errors[`co_sponsors.${i}.institution_id`]} />
                                            <div className="flex flex-wrap gap-4 text-sm">
                                                <label className="flex items-center gap-2">
                                                    <Checkbox checked={c.can_view_order_book} onCheckedChange={(v) => setCo(i, { can_view_order_book: v === true })} /> View order book
                                                </label>
                                                <label className="flex items-center gap-2">
                                                    <Checkbox checked={c.can_confirm_payments} onCheckedChange={(v) => setCo(i, { can_confirm_payments: v === true })} /> Confirm investor payments
                                                </label>
                                            </div>
                                            <div className="grid gap-2 sm:grid-cols-3">
                                                <Input placeholder="Bank (for investor payments)" value={c.bank_name} onChange={(e) => setCo(i, { bank_name: e.target.value })} aria-label="Co-sponsor bank" />
                                                <Input placeholder="Account name" value={c.bank_account_name} onChange={(e) => setCo(i, { bank_account_name: e.target.value })} aria-label="Co-sponsor account name" />
                                                <Input
                                                    placeholder="Account number"
                                                    inputMode="numeric"
                                                    maxLength={10}
                                                    value={c.bank_account_number}
                                                    onChange={(e) => setCo(i, { bank_account_number: e.target.value.replace(/\D/g, '') })}
                                                    aria-label="Co-sponsor account number"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Section>

                    <div className="bg-background/90 sticky bottom-0 z-10 flex justify-end gap-2 border-t py-4 backdrop-blur">
                        <Button variant="outline" asChild>
                            <Link href={editing ? route('tsp.offers.show', offer!.id) : route('tsp.offers.index')}>Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing && <LoaderCircle className="size-4 animate-spin" />}
                            {editing ? 'Save changes' : 'Save draft'}
                        </Button>
                    </div>
                </form>
            </Page>
        </AppLayout>
    );
}
