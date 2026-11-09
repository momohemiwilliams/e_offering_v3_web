import { TextField } from '@/components/form-field';
import InputError from '@/components/input-error';
import { ConsentNotice } from '@/components/onboarding/consent';
import { DetailList, Steps } from '@/components/section';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import AuthBrandLayout from '@/layouts/auth/auth-brand-layout';
import { Head, Link, useForm } from '@/lib/app';
import { ArrowLeft, BadgeCheck, LoaderCircle } from 'lucide-react';
import { FormEvent } from 'react';

interface Verified {
    first_name: string;
    last_name: string;
    bvn: string;
    phone: string | null;
    email: string | null;
    address: string | null;
}

/**
 * Retail onboarding (unchanged flow): step 1 verifies the BVN, step 2 collects contact and
 * settlement details. BVN data comes from the server, never from the browser.
 */
export default function RetailOnboarding({ verified, usesIgree }: { verified: Verified | null; usesIgree: boolean }) {
    const verify = useForm({ consent: false as boolean, bvn: '', first_name: '', last_name: '', date_of_birth: '' });
    const complete = useForm({
        email: verified?.email ?? '',
        phone: verified?.phone ?? '',
        address: verified?.address ?? '',
        csd_name: 'CSCS',
        csd_account_number: '',
        bank_name: '',
        bank_account_name: verified ? `${verified.first_name} ${verified.last_name}` : '',
        bank_account_number: '',
        terms: false as boolean,
    });
    const vErrors = verify.errors as Record<string, string>;
    const cErrors = complete.errors as Record<string, string>;

    return (
        <AuthBrandLayout title="Retail Investor" description="Get started with your valid Bank Verification Number (BVN)." wide>
            <Head title="Retail investor onboarding" />
            <div className="mb-6 flex items-center justify-between gap-4">
                <Link href={route('onboarding.choose')} className="text-muted-foreground inline-flex items-center gap-1 text-sm hover:underline">
                    <ArrowLeft className="text-gold size-4" /> Account types
                </Link>
                <Steps steps={['Verify BVN', 'Your details']} current={verified ? 1 : 0} />
            </div>

            {!verified ? (
                <form
                    onSubmit={(e: FormEvent) => {
                        e.preventDefault();
                        verify.post(route('onboarding.retail.verify'));
                    }}
                    className="space-y-4"
                >
                    {usesIgree ? (
                        <p className="text-muted-foreground text-sm">
                            You will be taken to the secure BVN consent page. After you approve, you return here to finish registration.
                        </p>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <TextField label="BVN" required inputMode="numeric" maxLength={11} value={verify.data.bvn} onChange={(v) => verify.setData('bvn', v.replace(/\D/g, ''))} error={vErrors.bvn} hint="11 digits" />
                            <TextField label="Date of birth" type="date" value={verify.data.date_of_birth} onChange={(v) => verify.setData('date_of_birth', v)} error={vErrors.date_of_birth} />
                            <TextField label="First name (as on BVN)" required value={verify.data.first_name} onChange={(v) => verify.setData('first_name', v)} error={vErrors.first_name} />
                            <TextField label="Last name (as on BVN)" required value={verify.data.last_name} onChange={(v) => verify.setData('last_name', v)} error={vErrors.last_name} />
                        </div>
                    )}
                    {usesIgree && <InputError message={vErrors.bvn} />}
                    <ConsentNotice checked={verify.data.consent} onChange={(v) => verify.setData('consent', v)} error={vErrors.consent} />
                    <Button type="submit" className="w-full" disabled={verify.processing}>
                        {verify.processing && <LoaderCircle className="size-4 animate-spin" />}
                        {usesIgree ? 'Continue to BVN verification' : 'Validate BVN'}
                    </Button>
                </form>
            ) : (
                <form
                    onSubmit={(e: FormEvent) => {
                        e.preventDefault();
                        complete.post(route('onboarding.retail.store'));
                    }}
                    className="space-y-6"
                >
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950">
                        <p className="mb-3 flex items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-200">
                            <BadgeCheck className="size-4" /> BVN verified
                        </p>
                        <DetailList
                            columns={3}
                            items={[
                                { label: 'First name', value: verified.first_name },
                                { label: 'Last name', value: verified.last_name },
                                { label: 'BVN', value: verified.bvn },
                            ]}
                        />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <TextField label="Email address" type="email" required value={complete.data.email} onChange={(v) => complete.setData('email', v)} error={cErrors.email} />
                        <TextField label="Phone number" required value={complete.data.phone} onChange={(v) => complete.setData('phone', v)} error={cErrors.phone} />
                        <TextField label="Residential address" value={complete.data.address} onChange={(v) => complete.setData('address', v)} error={cErrors.address} className="sm:col-span-2" />
                        <TextField label="CSD (e.g. CSCS, FMDQ Depository)" value={complete.data.csd_name} onChange={(v) => complete.setData('csd_name', v)} error={cErrors.csd_name} />
                        <TextField label="CSD account number (CHN / BPID)" value={complete.data.csd_account_number} onChange={(v) => complete.setData('csd_account_number', v)} error={cErrors.csd_account_number} />
                        <TextField label="Bank name" value={complete.data.bank_name} onChange={(v) => complete.setData('bank_name', v)} error={cErrors.bank_name} />
                        <TextField label="Account number (NUBAN)" inputMode="numeric" maxLength={10} value={complete.data.bank_account_number} onChange={(v) => complete.setData('bank_account_number', v.replace(/\D/g, ''))} error={cErrors.bank_account_number} />
                        <TextField label="Account name" value={complete.data.bank_account_name} onChange={(v) => complete.setData('bank_account_name', v)} error={cErrors.bank_account_name} className="sm:col-span-2" />
                    </div>
                    <div className="flex items-start gap-2">
                        <Checkbox id="terms" checked={complete.data.terms} onCheckedChange={(v) => complete.setData('terms', v === true)} className="mt-0.5" />
                        <Label htmlFor="terms" className="text-sm font-normal">
                            I accept the e-Offering Platform terms and conditions.
                        </Label>
                    </div>
                    <InputError message={cErrors.terms} />
                    <Button type="submit" className="w-full" disabled={complete.processing}>
                        {complete.processing && <LoaderCircle className="size-4 animate-spin" />}
                        Create my investor account
                    </Button>
                </form>
            )}
        </AuthBrandLayout>
    );
}
