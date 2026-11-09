import AppLogoIcon from '@/components/app-logo-icon';
import { FlashMessages } from '@/components/flash-messages';
import { ThemeToggle } from '@/components/theme-toggle';
import { Link } from '@/lib/app';
import { Clock3, Handshake, LockKeyhole, Radio } from 'lucide-react';

interface AuthLayoutProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
    /** Wider form column for the onboarding forms. */
    wide?: boolean;
}

const NAVY = '#1d326d';
const GOLD = '#c79d51';

const highlights = [
    { icon: Handshake, text: 'Efficient interaction between sponsors, investors, regulators and the depository.' },
    { icon: LockKeyhole, text: 'Secure investments with two-step sign-in and a complete audit trail.' },
    { icon: Radio, text: 'Real-time order book, allotment and lodgement updates.' },
    { icon: Clock3, text: 'Broad access to primary-market offers, end to end.' },
];

/**
 * Legacy onboarding split screen, improved: the "e-Offering Platform" welcome panel in
 * navy and gold beside the form card. Panel colours are fixed so the brand reads the same
 * in dark mode; the form side follows the theme toggle.
 */
export default function AuthBrandLayout({ children, title, description, wide = false }: AuthLayoutProps) {
    return (
        <div className="bg-background flex min-h-svh">
            <aside className="relative hidden w-[42%] max-w-xl flex-col overflow-hidden p-10 text-white lg:flex" style={{ backgroundColor: NAVY }}>
                <div aria-hidden className="pointer-events-none absolute -right-28 -bottom-36 size-[380px] rounded-full border-[26px] opacity-90" style={{ borderColor: GOLD }} />
                <div aria-hidden className="pointer-events-none absolute -top-24 -left-24 size-64 rounded-full border-[18px] border-white/10" />

                <Link href={route('home')} className="relative z-10 inline-flex w-fit items-center rounded-md bg-white px-3 py-2">
                    <AppLogoIcon className="h-8 dark:bg-transparent dark:p-0" />
                </Link>

                <div className="relative z-10 my-auto max-w-md">
                    <p className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: GOLD }}>
                        FMDQ e-Offering
                    </p>
                    <h2 className="mt-3 text-[35px] leading-tight font-semibold">e-Offering Platform</h2>
                    <p className="mt-3 text-sm text-white/80">
                        Unlocking investment opportunities through automated, standardised primary market transactions.
                    </p>
                    <ul className="mt-8 space-y-4 text-sm text-white/85">
                        {highlights.map(({ icon: Icon, text }) => (
                            <li key={text} className="flex items-start gap-3">
                                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: GOLD, color: NAVY }}>
                                    <Icon className="size-4" />
                                </span>
                                <span>{text}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="relative z-10 mt-10 text-xs text-white/60">
                    Powered by iQx Consult Limited · &copy; {new Date().getFullYear()} FMDQ Group PLC
                </p>
            </aside>

            <main className="relative flex flex-1 flex-col">
                <ThemeToggle className="absolute top-4 right-4 z-10" />
                <div className="flex flex-1 flex-col items-center justify-center p-6 md:p-10">
                    <div className={wide ? 'w-full max-w-3xl' : 'w-full max-w-md'}>
                        <Link href={route('home')} className="mb-8 flex justify-center lg:hidden">
                            <AppLogoIcon className="h-10" />
                        </Link>
                        <FlashMessages />
                        <div className="bg-card mt-2 rounded-2xl border p-6 shadow-sm md:p-8">
                            {(title || description) && (
                                <div className="mb-6 space-y-1.5 text-center">
                                    {title && <h1 className="text-navy text-2xl font-semibold dark:text-white">{title}</h1>}
                                    {description && <p className="text-muted-foreground text-sm">{description}</p>}
                                </div>
                            )}
                            {children}
                        </div>
                    </div>
                </div>
                <p className="bg-navy-dark px-4 py-2 text-center text-[11px] text-[#e3c87a] italic">
                    FMDQ Depository Limited is registered and regulated by the Securities and Exchange Commission, Nigeria
                </p>
            </main>
        </div>
    );
}
