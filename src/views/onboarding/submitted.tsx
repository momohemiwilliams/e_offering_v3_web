import { Button } from '@/components/ui/button';
import AuthBrandLayout from '@/layouts/auth/auth-brand-layout';
import { Head, Link } from '@/lib/app';
import { CheckCircle2 } from 'lucide-react';

export default function Submitted({ kind, reference }: { kind: string; reference: string | null }) {
    const retail = kind === 'retail';

    return (
        <AuthBrandLayout title={retail ? 'Your account is ready' : 'Request submitted'}>
            <Head title="Onboarding submitted" />
            <div className="space-y-4 text-center">
                <CheckCircle2 className="mx-auto size-14 text-emerald-500" />
                {retail ? (
                    <p className="text-muted-foreground text-sm">
                        We emailed <strong className="text-foreground">{reference}</strong> a link to set your password. Then sign in with your email,
                        password and the one-time code we send you.
                    </p>
                ) : (
                    <>
                        <p className="text-muted-foreground text-sm">
                            FMDQ will review your onboarding request. Each user receives an email to set a password once it is approved.
                        </p>
                        {reference && (
                            <p className="bg-muted rounded-md px-3 py-2 text-sm">
                                Reference: <span className="font-mono font-semibold">{reference}</span>
                            </p>
                        )}
                    </>
                )}
                <Button asChild className="w-full">
                    <Link href={route('login')}>Go to sign in</Link>
                </Button>
            </div>
        </AuthBrandLayout>
    );
}
