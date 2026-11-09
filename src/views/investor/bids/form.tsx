import { Field, FileField, MoneyField, SelectField, TextField } from '@/components/form-field';
import InputError from '@/components/input-error';
import { rateSummary } from '@/components/offers/offer-detail';
import { PageHeader } from '@/components/page-header';
import { DetailList, Page, Section } from '@/components/section';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { amountInWords, formatDateTime, formatMoney, toNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type Bid, type Offer, type PayeeOption } from '@/types';
import { Head, Link, useForm } from '@/lib/app';
import { Landmark, LoaderCircle } from 'lucide-react';
import { FormEvent } from 'react';

interface Props {
    offer: Offer;
    bid: Bid | null;
    payees: PayeeOption[];
    investorTypes: Record<string, string>;
    defaults: { investor_type: string; csd_name: string | null; csd_account_number: string | null; bank_name: string | null; bank_account_name: string | null; bank_account_number: string | null };
}

/**
 * Commitment form (CR s6.1-6.2), rebuilt as a short sectioned form in place of the
 * 2,700-line paper replica. No OTP here: the login OTP replaces it.
 */
export default function BidForm({ offer, bid, payees, investorTypes, defaults }: Props) {
    const editing = bid !== null;
    const form = useForm<{
        investor_type: string;
        amount: string;
        rate: string;
        yield: string;
        csd_name: string;
        csd_account_number: string;
        bank_name: string;
        bank_account_name: string;
        bank_account_number: string;
        payee_type: string;
        payee_id: string;
        payment_reference: string;
        evidence: File | null;
        declaration: boolean;
        _method?: string;
    }>({
        investor_type: bid?.investor_type ?? defaults.investor_type ?? '',
        amount: bid?.amount ?? '',
        rate: bid?.rate ?? '',
        yield: bid?.yield ?? '',
        csd_name: bid?.csd_name ?? defaults.csd_name ?? '',
        csd_account_number: bid?.csd_account_number ?? defaults.csd_account_number ?? '',
        bank_name: bid?.bank_name ?? defaults.bank_name ?? '',
        bank_account_name: bid?.bank_account_name ?? defaults.bank_account_name ?? '',
        bank_account_number: bid?.bank_account_number ?? defaults.bank_account_number ?? '',
        payee_type: bid?.payee_type ?? payees[0]?.type ?? 'sponsor',
        payee_id: bid?.payee_id ? String(bid.payee_id) : payees[0]?.id ? String(payees[0].id) : '',
        payment_reference: bid?.payment_reference ?? '',
        evidence: null,
        declaration: false,
    });
    const errors = form.errors as Record<string, string>;
    const min = toNumber(offer.min_subscription_amount);
    const step = toNumber(offer.subsequent_increment);
    const amount = toNumber(form.data.amount);
    const amountHint =
        amount > 0 && amount < min
            ? `Below the minimum of ${formatMoney(min, 0)}.`
            : step > 0 && amount > min && Math.round((amount - min) * 100) % Math.round(step * 100) !== 0
              ? `Above the minimum, amounts go up in steps of ${formatMoney(step, 0)}.`
              : `Minimum ${formatMoney(min, 0)}${step > 0 ? `, then multiples of ${formatMoney(step, 0)}` : ''}.`;
    const selected = payees.find((p) => p.type === form.data.payee_type && String(p.id ?? '') === form.data.payee_id) ?? payees[0];
    const priceBased = offer.security_type === 'equities' || offer.security_type === 'depository_receipts';

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (editing) {
            form.transform((d) => ({ ...d, _method: 'put' }));
            form.post(route('investor.bids.update', bid!.id), { forceFormData: true });
        } else {
            form.post(route('investor.bids.store', offer.id), { forceFormData: true });
        }
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Offers', href: route('investor.offers.index') },
                { title: offer.issuer_name, href: route('investor.offers.show', offer.id) },
                { title: editing ? 'Amend bid' : 'Commitment form', href: '#' },
            ]}
        >
            <Head title={editing ? 'Amend bid' : 'Commitment form'} />
            <Page className="max-w-4xl">
                <PageHeader title={editing ? `Amend bid ${bid!.reference}` : 'Commitment Form'} description={`${offer.issuer_name} · ${offer.reference} · closes ${formatDateTime(offer.close_at)}`} />
                <form onSubmit={submit} className="space-y-6">
                    <Section title="1. Your bid">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <SelectField
                                label="Investor type"
                                required
                                value={form.data.investor_type}
                                onChange={(v) => form.setData('investor_type', v)}
                                options={Object.entries(investorTypes).map(([value, label]) => ({ value, label }))}
                                error={errors.investor_type}
                                hint="Used for investor-type-based pro-rata allotment."
                            />
                            <div>
                                <MoneyField label="Participation amount" required value={form.data.amount} onChange={(v) => form.setData('amount', v)} error={errors.amount} hint={amountHint} />
                                {amount > 0 && <p className="text-muted-foreground mt-1 text-xs italic">{amountInWords(amount)}</p>}
                            </div>
                            {offer.price_discovery_method === 'fixed_rate' ? (
                                <Field label={offer.rate_label}>
                                    <p className="py-2 text-sm font-medium">{rateSummary(offer)} (fixed)</p>
                                </Field>
                            ) : (
                                <TextField
                                    label={`Bid ${offer.rate_label.toLowerCase()}${priceBased ? '' : ' (%)'}`}
                                    type="number"
                                    step="0.0001"
                                    required
                                    value={form.data.rate}
                                    onChange={(v) => form.setData('rate', v)}
                                    error={errors.rate}
                                    hint={offer.price_discovery_method === 'book_building' ? `Within the range ${rateSummary(offer)}.` : undefined}
                                />
                            )}
                            <TextField label="Bid yield (%)" type="number" step="0.0001" value={form.data.yield} onChange={(v) => form.setData('yield', v)} error={errors.yield} hint="Optional" />
                        </div>
                    </Section>

                    <Section title="2. Allotment and refund details">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <TextField label="CSD (e.g. CSCS, FMDQ Depository)" required value={form.data.csd_name} onChange={(v) => form.setData('csd_name', v)} error={errors.csd_name} />
                            <TextField label="CSD account number (CHN / BPID)" required value={form.data.csd_account_number} onChange={(v) => form.setData('csd_account_number', v)} error={errors.csd_account_number} />
                            <TextField label="Bank name" required value={form.data.bank_name} onChange={(v) => form.setData('bank_name', v)} error={errors.bank_name} />
                            <TextField
                                label="Account number (NUBAN)"
                                required
                                inputMode="numeric"
                                maxLength={10}
                                value={form.data.bank_account_number}
                                onChange={(v) => form.setData('bank_account_number', v.replace(/\D/g, ''))}
                                error={errors.bank_account_number}
                            />
                            <TextField label="Account name" required value={form.data.bank_account_name} onChange={(v) => form.setData('bank_account_name', v)} error={errors.bank_account_name} className="sm:col-span-2" />
                        </div>
                    </Section>

                    <Section title="3. Payment" description="Pay the receiving agent or sponsor of your choice and upload evidence. Your bid is placed whether or not payment is confirmed yet.">
                        <div className="space-y-4">
                            <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Pay to">
                                {payees.map((p) => {
                                    const active = selected === p;
                                    return (
                                        <button
                                            type="button"
                                            key={`${p.type}-${p.id}`}
                                            role="radio"
                                            aria-checked={active}
                                            onClick={() => form.setData((d) => ({ ...d, payee_type: p.type, payee_id: p.id ? String(p.id) : '' }))}
                                            className={cn('rounded-lg border p-3 text-left text-sm', active ? 'border-navy bg-navy/5' : 'hover:border-navy/40')}
                                        >
                                            <span className="flex items-center gap-2 font-medium">
                                                <Landmark className="text-gold size-4" /> {p.name}
                                            </span>
                                            <span className="text-muted-foreground mt-1 block text-xs">
                                                {p.bank_name} · {p.account_name} · <span className="font-mono">{p.account_number}</span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            <InputError message={errors.payee_id ?? errors.payee_type} />
                            {selected && (
                                <div className="bg-muted/50 rounded-lg border p-4">
                                    <DetailList
                                        columns={3}
                                        items={[
                                            { label: 'Bank', value: selected.bank_name },
                                            { label: 'Account name', value: selected.account_name },
                                            { label: 'Account number', value: <span className="font-mono text-base">{selected.account_number}</span> },
                                        ]}
                                    />
                                </div>
                            )}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <TextField label="Payment reference" value={form.data.payment_reference} onChange={(v) => form.setData('payment_reference', v)} error={errors.payment_reference} hint="Optional" />
                                <FileField label="Evidence of payment" file={form.data.evidence} onChange={(f) => form.setData('evidence', f)} error={errors.evidence} hint="Optional now; you can upload it later. PDF, JPG or PNG up to 5 MB." />
                            </div>
                        </div>
                    </Section>

                    <Section>
                        <div className="flex items-start gap-2">
                            <Checkbox id="declaration" checked={form.data.declaration} onCheckedChange={(v) => form.setData('declaration', v === true)} className="mt-0.5" />
                            <Label htmlFor="declaration" className="text-sm leading-snug font-normal">
                                I have read the offer documents, the details above are correct, and I understand that submitting a bid does not guarantee allocation or allotment.
                            </Label>
                        </div>
                        <InputError message={errors.declaration} className="mt-2" />
                        {(errors.offer || errors.bid) && <InputError message={errors.offer ?? errors.bid} className="mt-2" />}
                    </Section>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" asChild>
                            <Link href={editing ? route('investor.bids.show', bid!.id) : route('investor.offers.show', offer.id)}>Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing && <LoaderCircle className="size-4 animate-spin" />}
                            {editing ? 'Save amendment' : 'Submit bid'}
                        </Button>
                    </div>
                </form>
            </Page>
        </AppLayout>
    );
}
