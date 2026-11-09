import { Field, TextField } from '@/components/form-field';
import { ConsentNotice } from '@/components/onboarding/consent';
import { Button } from '@/components/ui/button';
import AuthBrandLayout from '@/layouts/auth/auth-brand-layout';
import { cn } from '@/lib/utils';
import { Head, Link, useForm } from '@/lib/app';
import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { FormEvent } from 'react';

/** CR s3.3 step 1: contact name, email and phone number. */
export default function RegulatorOnboarding() {
    const form = useForm({ consent: false as boolean, regulator_body: 'SEC', name: '', email: '', phone: '' });
    const errors = form.errors as Record<string, string>;

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(route('onboarding.regulator.store'));
    };

    return (
        <AuthBrandLayout title="Regulator (SEC / CBN)" description="For officers who review and approve offers requiring regulatory sign-off.">
            <Head title="Regulator onboarding" />
            <Link href={route('onboarding.choose')} className="text-muted-foreground mb-6 inline-flex items-center gap-1 text-sm hover:underline">
                <ArrowLeft className="text-gold size-4" /> Account types
            </Link>
            <form onSubmit={submit} className="space-y-4">
                <Field label="Regulator" required error={errors.regulator_body}>
                    <div className="grid grid-cols-2 gap-2">
                        {['SEC', 'CBN'].map((body) => (
                            <button
                                key={body}
                                type="button"
                                onClick={() => form.setData('regulator_body', body)}
                                aria-pressed={form.data.regulator_body === body}
                                className={cn(
                                    'rounded-lg border px-4 py-2.5 text-sm font-medium transition',
                                    form.data.regulator_body === body ? 'border-navy bg-navy text-white' : 'hover:border-navy/40',
                                )}
                            >
                                {body}
                            </button>
                        ))}
                    </div>
                </Field>
                <TextField label="Contact name" required value={form.data.name} onChange={(v) => form.setData('name', v)} error={errors.name} />
                <TextField label="Official email address" type="email" required value={form.data.email} onChange={(v) => form.setData('email', v)} error={errors.email} />
                <TextField label="Phone number" required value={form.data.phone} onChange={(v) => form.setData('phone', v)} error={errors.phone} />
                <ConsentNotice checked={form.data.consent} onChange={(v) => form.setData('consent', v)} error={errors.consent} />
                <Button type="submit" className="w-full" disabled={form.processing}>
                    {form.processing && <LoaderCircle className="size-4 animate-spin" />}
                    Submit request
                </Button>
            </form>
        </AuthBrandLayout>
    );
}
