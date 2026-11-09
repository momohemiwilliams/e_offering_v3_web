import { Field, TextField } from '@/components/form-field';
import { PageHeader } from '@/components/page-header';
import { Page, Section } from '@/components/section';
import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { toInputDateTime } from '@/lib/format';
import { amendableLabels } from '@/lib/labels';
import { type Offer } from '@/types';
import { Head, Link, useForm } from '@/lib/app';
import { Info, LoaderCircle } from 'lucide-react';
import { FormEvent } from 'react';

/**
 * CR s4.6: change permitted details any time before allotment starts (also after close),
 * with a mandatory reason; goes through the same approval workflow and notifies active bidders.
 */
export default function AmendOffer({ offer, dayCounts, activeBidders }: { offer: Offer; amendable: string[]; dayCounts: string[]; activeBidders: number }) {
    const initial: Record<string, string> = {
        open_at: toInputDateTime(offer.open_at),
        close_at: toInputDateTime(offer.close_at),
        offer_size: offer.offer_size ?? '',
        min_subscription_threshold: offer.min_subscription_threshold ?? '',
        min_subscription_amount: offer.min_subscription_amount ?? '',
        subsequent_increment: offer.subsequent_increment ?? '',
        rate: offer.rate ?? '',
        rate_min: offer.rate_min ?? '',
        rate_max: offer.rate_max ?? '',
        implied_yield: offer.implied_yield ?? '',
        issue_price: offer.issue_price ?? '',
        maturity_date: offer.maturity_date?.slice(0, 10) ?? '',
        allotment_date: offer.allotment_date?.slice(0, 10) ?? '',
        tenor: offer.tenor ?? '',
        day_count_fraction: offer.day_count_fraction ?? '',
        issue_description: offer.issue_description ?? '',
        bank_name: offer.bank_name ?? '',
        bank_account_name: offer.bank_account_name ?? '',
        bank_account_number: offer.bank_account_number ?? '',
    };
    const form = useForm<{ reason: string; changes: Record<string, string> }>({ reason: '', changes: { ...initial } });
    const errors = form.errors as Record<string, string>;
    const set = (k: string, v: string) => form.setData('changes', { ...form.data.changes, [k]: v });
    const changed = Object.keys(initial).filter((k) => String(form.data.changes[k] ?? '') !== String(initial[k] ?? ''));

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const only: Record<string, string> = {};
        changed.forEach((k) => (only[k] = form.data.changes[k]));
        form.transform((d) => ({ ...d, changes: only }));
        form.post(route('tsp.offers.amendments.store', offer.id));
    };

    const numeric = (k: string, step = '0.0001') => (
        <TextField key={k} label={amendableLabels[k]} type="number" step={step} value={form.data.changes[k]} onChange={(v) => set(k, v)} error={errors[`changes.${k}`]} />
    );

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Offers', href: route('tsp.offers.index') },
                { title: offer.reference, href: route('tsp.offers.show', offer.id) },
                { title: 'Amend', href: route('tsp.offers.amend', offer.id) },
            ]}
        >
            <Head title={`Amend ${offer.reference}`} />
            <Page className="max-w-4xl">
                <PageHeader title={`Amend ${offer.reference}`} description={offer.issuer_name} />
                <div className="flex items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200">
                    <Info className="mt-0.5 size-4 shrink-0" />
                    <p>
                        Your Authoriser must approve the amendment. Once approved it applies immediately, the original and amended values are kept in the audit trail and{' '}
                        <strong>{activeBidders}</strong> investor{activeBidders === 1 ? '' : 's'} with active bids will be notified.
                    </p>
                </div>
                <form onSubmit={submit} className="space-y-6">
                    <Section title="Dates">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label={amendableLabels.open_at} error={errors['changes.open_at']}>
                                <DateTimePicker value={form.data.changes.open_at} onChange={(v) => set('open_at', v)} />
                            </Field>
                            <Field label={amendableLabels.close_at} error={errors['changes.close_at'] ?? errors.close_at}>
                                <DateTimePicker value={form.data.changes.close_at} onChange={(v) => set('close_at', v)} />
                            </Field>
                            <TextField label={amendableLabels.maturity_date} type="date" value={form.data.changes.maturity_date} onChange={(v) => set('maturity_date', v)} error={errors['changes.maturity_date']} />
                            <TextField label={amendableLabels.allotment_date} type="date" value={form.data.changes.allotment_date} onChange={(v) => set('allotment_date', v)} error={errors['changes.allotment_date']} />
                        </div>
                    </Section>
                    <Section title="Size and subscription">
                        <div className="grid gap-4 sm:grid-cols-2">
                            {numeric('offer_size', '0.01')}
                            {numeric('min_subscription_threshold', '0.01')}
                            {numeric('min_subscription_amount', '0.01')}
                            {numeric('subsequent_increment', '0.01')}
                        </div>
                    </Section>
                    <Section title="Price-discovery parameters">
                        <div className="grid gap-4 sm:grid-cols-2">
                            {offer.price_discovery_method === 'fixed_rate' && numeric('rate')}
                            {offer.price_discovery_method === 'book_building' && (
                                <>
                                    {numeric('rate_min')}
                                    {numeric('rate_max')}
                                </>
                            )}
                            {numeric('implied_yield')}
                            {numeric('issue_price')}
                            <TextField label={amendableLabels.tenor} value={form.data.changes.tenor} onChange={(v) => set('tenor', v)} error={errors['changes.tenor']} />
                            <Field label={amendableLabels.day_count_fraction}>
                                <select value={form.data.changes.day_count_fraction} onChange={(e) => set('day_count_fraction', e.target.value)} className="border-input bg-background h-9 rounded-md border px-2 text-sm">
                                    <option value="">—</option>
                                    {dayCounts.map((d) => (
                                        <option key={d}>{d}</option>
                                    ))}
                                </select>
                            </Field>
                        </div>
                    </Section>
                    <Section title="Description and payment account">
                        <div className="grid gap-4 sm:grid-cols-3">
                            <Field label={amendableLabels.issue_description} className="sm:col-span-3">
                                <Textarea rows={2} value={form.data.changes.issue_description} onChange={(e) => set('issue_description', e.target.value)} />
                            </Field>
                            <TextField label={amendableLabels.bank_name} value={form.data.changes.bank_name} onChange={(v) => set('bank_name', v)} />
                            <TextField label={amendableLabels.bank_account_name} value={form.data.changes.bank_account_name} onChange={(v) => set('bank_account_name', v)} />
                            <TextField label={amendableLabels.bank_account_number} value={form.data.changes.bank_account_number} onChange={(v) => set('bank_account_number', v)} error={errors['changes.bank_account_number']} />
                        </div>
                    </Section>
                    <Section title="Reason for the change">
                        <Field label="Reason" required error={errors.reason ?? errors.changes}>
                            <Textarea rows={3} required value={form.data.reason} onChange={(e) => form.setData('reason', e.target.value)} />
                        </Field>
                        <p className="text-muted-foreground mt-3 text-sm">
                            Changing: {changed.length ? changed.map((k) => amendableLabels[k]).join(', ') : 'nothing yet'}
                        </p>
                    </Section>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" asChild>
                            <Link href={route('tsp.offers.show', offer.id)}>Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={form.processing || changed.length === 0}>
                            {form.processing && <LoaderCircle className="size-4 animate-spin" />}
                            Submit amendment
                        </Button>
                    </div>
                </form>
            </Page>
        </AppLayout>
    );
}
