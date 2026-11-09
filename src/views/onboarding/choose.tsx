import AuthBrandLayout from '@/layouts/auth/auth-brand-layout';
import { cn } from '@/lib/utils';
import { Head, Link } from '@/lib/app';
import { ArrowRight, Building2, Landmark, ShieldCheck, UserRound } from 'lucide-react';

const icons = { retail: UserRound, institutional: Building2, tsp: Landmark, regulator: ShieldCheck };
const hints: Record<string, string> = {
    retail: 'Get started with your valid Bank Verification Number (BVN).',
    institutional: 'Onboard your organisation with valid CAC documentation.',
    tsp: 'Onboard your organisation and its Inputter / Authoriser users.',
    regulator: 'For SEC / CBN officers who review and approve allotments.',
};

/** CR s3: four account types, each with a short description. */
export default function Choose({ accountTypes }: { accountTypes: Record<string, { label: string; description: string }> }) {
    return (
        <AuthBrandLayout title="Account Type" description="Select the account type that describes you to continue." wide>
            <Head title="Register" />
            <div className="grid gap-3 sm:grid-cols-2">
                {Object.entries(accountTypes).map(([key, type]) => {
                    const Icon = icons[key as keyof typeof icons] ?? UserRound;
                    return (
                        <Link
                            key={key}
                            href={route('onboarding.form', key)}
                            className={cn(
                                'group hover:border-navy focus-visible:ring-navy/30 flex flex-col rounded-xl border p-5 transition outline-none hover:shadow-md focus-visible:ring-4',
                            )}
                        >
                            <span className="bg-navy/10 text-navy group-hover:bg-navy flex size-11 items-center justify-center rounded-lg transition group-hover:text-white dark:text-white">
                                <Icon className="size-5" />
                            </span>
                            <span className="text-navy mt-4 font-semibold dark:text-white">{type.label}</span>
                            <span className="text-muted-foreground mt-1 flex-1 text-sm">{type.description}</span>
                            <span className="text-muted-foreground mt-3 text-xs">{hints[key]}</span>
                            <span className="text-navy mt-3 inline-flex items-center gap-1 text-sm font-medium dark:text-gold-light">
                                Continue <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                            </span>
                        </Link>
                    );
                })}
            </div>
            <div className="bg-muted/50 text-muted-foreground mt-6 rounded-lg border p-3 text-[11px] leading-relaxed">
                <strong>Abbreviations:</strong> BVN – Bank Verification Number; CAC – Corporate Affairs Commission; QII – Qualified Institutional Investor;
                TSP/RM – Transaction Sponsor / Registration Member; SEC – Securities and Exchange Commission; CBN – Central Bank of Nigeria.
            </div>
            <p className="text-muted-foreground mt-6 text-center text-sm">
                Already have an account?{' '}
                <Link href={route('login')} className="text-navy font-medium hover:underline dark:text-gold-light">
                    Sign in
                </Link>
            </p>
        </AuthBrandLayout>
    );
}
