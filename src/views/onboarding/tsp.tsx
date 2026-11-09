import { FileField, TextField } from '@/components/form-field';
import { ConsentNotice } from '@/components/onboarding/consent';
import { defaultUsers, type OnboardUser, UsersEditor } from '@/components/onboarding/users-editor';
import { Steps } from '@/components/section';
import { Button } from '@/components/ui/button';
import AuthBrandLayout from '@/layouts/auth/auth-brand-layout';
import { Head, Link, useForm } from '@/lib/app';
import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { FormEvent } from 'react';

/** CR s3.2 steps 1-3: institution, proof of registration, users with access levels. */
export default function TspOnboarding() {
    const form = useForm<{
        consent: boolean;
        name: string;
        email: string;
        phone: string;
        registration_number: string;
        proof: File | null;
        users: OnboardUser[];
    }>({ consent: false, name: '', email: '', phone: '', registration_number: '', proof: null, users: defaultUsers });
    const errors = form.errors as Record<string, string>;

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(route('onboarding.tsp.store'), { forceFormData: true });
    };

    return (
        <AuthBrandLayout title="Transaction Sponsor / Registration Member" description="Onboard your organisation and its authorised users." wide>
            <Head title="TSP/RM onboarding" />
            <div className="mb-6 flex items-center justify-between gap-4">
                <Link href={route('onboarding.choose')} className="text-muted-foreground inline-flex items-center gap-1 text-sm hover:underline">
                    <ArrowLeft className="text-gold size-4" /> Account types
                </Link>
                <Steps steps={['Institution', 'Users', 'FMDQ review']} current={form.data.name && form.data.proof ? 1 : 0} />
            </div>
            <form onSubmit={submit} className="space-y-6">
                <fieldset className="grid gap-4 sm:grid-cols-2">
                    <legend className="text-navy mb-2 text-sm font-semibold dark:text-white">Institution details</legend>
                    <TextField label="Institution name" required value={form.data.name} onChange={(v) => form.setData('name', v)} error={errors.name} className="sm:col-span-2" />
                    <TextField label="Institution email" type="email" required value={form.data.email} onChange={(v) => form.setData('email', v)} error={errors.email} />
                    <TextField label="Phone number" value={form.data.phone} onChange={(v) => form.setData('phone', v)} error={errors.phone} />
                    <TextField label="FMDQ registration number" value={form.data.registration_number} onChange={(v) => form.setData('registration_number', v)} error={errors.registration_number} />
                    <FileField
                        label="Proof of registration"
                        required
                        file={form.data.proof}
                        onChange={(f) => form.setData('proof', f)}
                        error={errors.proof}
                        hint="PDF, JPG or PNG, up to 5 MB."
                    />
                </fieldset>

                <fieldset className="space-y-2">
                    <legend className="text-navy text-sm font-semibold dark:text-white">Authorised users</legend>
                    <p className="text-muted-foreground text-xs">Inputters prepare offers and allotments; Authorisers approve them.</p>
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
