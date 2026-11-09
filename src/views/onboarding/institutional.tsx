import { Field, FileField, TextField } from '@/components/form-field';
import { ConsentNotice } from '@/components/onboarding/consent';
import { defaultUsers, type OnboardUser, UsersEditor } from '@/components/onboarding/users-editor';
import { Button } from '@/components/ui/button';
import AuthBrandLayout from '@/layouts/auth/auth-brand-layout';
import { cn } from '@/lib/utils';
import { Head, Link, useForm } from '@/lib/app';
import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { FormEvent } from 'react';

/** QII / Non-QII onboarding with CAC documents and representatives (unchanged flow, CR s3.1). */
export default function InstitutionalOnboarding() {
    const form = useForm<{
        consent: boolean;
        category: 'qii' | 'non_qii' | '';
        name: string;
        registration_number: string;
        email: string;
        phone: string;
        address: string;
        certificate: File | null;
        memorandum: File | null;
        cac_directors: File | null;
        cac_shareholders: File | null;
        users: OnboardUser[];
    }>({
        consent: false,
        category: '',
        name: '',
        registration_number: '',
        email: '',
        phone: '',
        address: '',
        certificate: null,
        memorandum: null,
        cac_directors: null,
        cac_shareholders: null,
        users: defaultUsers,
    });
    const errors = form.errors as Record<string, string>;

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(route('onboarding.institutional.store'), { forceFormData: true });
    };

    return (
        <AuthBrandLayout title="QII / Non-QII Investor" description="Onboard your institution with valid CAC documentation." wide>
            <Head title="Institutional investor onboarding" />
            <Link href={route('onboarding.choose')} className="text-muted-foreground mb-6 inline-flex items-center gap-1 text-sm hover:underline">
                <ArrowLeft className="text-gold size-4" /> Account types
            </Link>
            <form onSubmit={submit} className="space-y-6">
                <Field label="Investor type" required error={errors.category}>
                    <div className="grid gap-2 sm:grid-cols-2" role="radiogroup">
                        {[
                            ['qii', 'Qualified Institutional Investor (QII)'],
                            ['non_qii', 'Non-Qualified Institutional Investor (Non-QII)'],
                        ].map(([value, label]) => (
                            <button
                                type="button"
                                role="radio"
                                aria-checked={form.data.category === value}
                                key={value}
                                onClick={() => form.setData('category', value as 'qii' | 'non_qii')}
                                className={cn(
                                    'rounded-lg border px-4 py-3 text-left text-sm transition',
                                    form.data.category === value ? 'border-navy bg-navy/5 text-navy font-medium dark:text-white' : 'hover:border-navy/40',
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="Registered institution name" required value={form.data.name} onChange={(v) => form.setData('name', v)} error={errors.name} className="sm:col-span-2" />
                    <TextField label="CAC registration number" required value={form.data.registration_number} onChange={(v) => form.setData('registration_number', v)} error={errors.registration_number} />
                    <TextField label="Institution email" type="email" required value={form.data.email} onChange={(v) => form.setData('email', v)} error={errors.email} />
                    <TextField label="Phone number" value={form.data.phone} onChange={(v) => form.setData('phone', v)} error={errors.phone} />
                    <TextField label="Registered address" value={form.data.address} onChange={(v) => form.setData('address', v)} error={errors.address} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <FileField label="Certificate of Incorporation" required file={form.data.certificate} onChange={(f) => form.setData('certificate', f)} error={errors.certificate} hint="PDF, JPG or PNG, up to 5 MB." />
                    <FileField label="Memorandum & Articles of Association" accept=".pdf" file={form.data.memorandum} onChange={(f) => form.setData('memorandum', f)} error={errors.memorandum} />
                    <FileField label="CAC 7 (Directors)" file={form.data.cac_directors} onChange={(f) => form.setData('cac_directors', f)} error={errors.cac_directors} />
                    <FileField label="CAC 7 (Shareholders)" file={form.data.cac_shareholders} onChange={(f) => form.setData('cac_shareholders', f)} error={errors.cac_shareholders} />
                </div>
                <fieldset className="space-y-2">
                    <legend className="text-navy text-sm font-semibold dark:text-white">Representatives</legend>
                    <UsersEditor users={form.data.users} onChange={(u) => form.setData('users', u)} errors={errors} />
                </fieldset>
                <ConsentNotice checked={form.data.consent} onChange={(v) => form.setData('consent', v)} error={errors.consent} />
                <Button type="submit" className="w-full" disabled={form.processing}>
                    {form.processing && <LoaderCircle className="size-4 animate-spin" />}
                    Submit onboarding request
                </Button>
            </form>
        </AuthBrandLayout>
    );
}
