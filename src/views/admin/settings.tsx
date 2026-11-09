import { MoneyField, TextField } from '@/components/form-field';
import { PageHeader } from '@/components/page-header';
import { Page, Section } from '@/components/section';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@/lib/app';
import { FormEvent } from 'react';

type Settings = {
    fmdq_admin_review_enabled: boolean;
    fmdq_admin_review_security_types: string[];
    platform_fee_enabled: boolean;
    platform_fee_amount: number | string;
    platform_fee_bank_name: string;
    platform_fee_account_name: string;
    platform_fee_account_number: string;
};

function Toggle({ id, checked, onChange, label, description }: { id: string; checked: boolean; onChange: (v: boolean) => void; label: string; description: string }) {
    return (
        <div className="flex items-start gap-3">
            <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(v === true)} className="mt-0.5" />
            <div>
                <Label htmlFor={id}>{label}</Label>
                <p className="text-muted-foreground text-sm">{description}</p>
            </div>
        </div>
    );
}

export default function AdminSettings({ settings, securityTypes }: { settings: Settings; securityTypes: { value: string; label: string }[] }) {
    const form = useForm<Settings>({ ...settings, fmdq_admin_review_security_types: settings.fmdq_admin_review_security_types ?? [] });

    const toggleType = (type: string) =>
        form.setData(
            'fmdq_admin_review_security_types',
            form.data.fmdq_admin_review_security_types.includes(type)
                ? form.data.fmdq_admin_review_security_types.filter((t) => t !== type)
                : [...form.data.fmdq_admin_review_security_types, type],
        );

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.put(route('admin.settings.update'), { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Settings', href: route('admin.settings') }]}>
            <Head title="Settings" />
            <Page>
                <PageHeader title="Settings" description="Platform switches from the Change Request. Every change is written to the audit trail." />
                <form onSubmit={submit} className="space-y-6">
                    <Section title="FMDQ Admin offer review" description="CR s4.4: built in, disabled by default. When on, it is an extra approval gate after the TSP Authoriser.">
                        <div className="space-y-4">
                            <Toggle
                                id="review"
                                checked={form.data.fmdq_admin_review_enabled}
                                onChange={(v) => form.setData('fmdq_admin_review_enabled', v)}
                                label="Require FMDQ Admin review before launch"
                                description="Applies to new submissions and to post-launch amendments."
                            />
                            {form.data.fmdq_admin_review_enabled && (
                                <div className="ml-7 space-y-2">
                                    <p className="text-sm font-medium">Security types that need review (none selected = all)</p>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {securityTypes.map((t) => (
                                            <label key={t.value} className="flex items-center gap-2 text-sm">
                                                <Checkbox checked={form.data.fmdq_admin_review_security_types.includes(t.value)} onCheckedChange={() => toggleType(t.value)} />
                                                {t.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Section>

                    <Section title="Annual platform fee" description="CR s3.2: a standalone yearly payment by each TSP/RM, not activated in the first year of launch.">
                        <div className="space-y-4">
                            <Toggle
                                id="fee"
                                checked={form.data.platform_fee_enabled}
                                onChange={(v) => form.setData('platform_fee_enabled', v)}
                                label="Charge the annual platform fee"
                                description="When on, TSP/RMs pay after registration and are suspended if a renewal is not paid by the due date."
                            />
                            <div className="grid gap-4 sm:grid-cols-2">
                                <MoneyField label="Annual fee" value={form.data.platform_fee_amount} onChange={(v) => form.setData('platform_fee_amount', v)} error={form.errors.platform_fee_amount} />
                                <TextField label="Bank name (bank transfer)" value={form.data.platform_fee_bank_name} onChange={(v) => form.setData('platform_fee_bank_name', v)} error={form.errors.platform_fee_bank_name} />
                                <TextField label="Account name" value={form.data.platform_fee_account_name} onChange={(v) => form.setData('platform_fee_account_name', v)} error={form.errors.platform_fee_account_name} />
                                <TextField label="Account number" value={form.data.platform_fee_account_number} onChange={(v) => form.setData('platform_fee_account_number', v)} error={form.errors.platform_fee_account_number} />
                            </div>
                        </div>
                    </Section>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing}>
                            Save settings
                        </Button>
                    </div>
                </form>
            </Page>
        </AppLayout>
    );
}
