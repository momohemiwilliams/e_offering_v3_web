import AppLogoIcon from '@/components/app-logo-icon';
import { AppFooter } from '@/components/app-footer';
import { Button } from '@/components/ui/button';
import { Head, Link } from '@/lib/app';
import { ArrowRight, Clock3, Globe2, Handshake, LockKeyhole, Landmark, UsersRound } from 'lucide-react';

const why = [
    { icon: Handshake, title: 'Efficient Interaction', text: 'Sponsors, investors, regulators and the depository work on one standardised workflow.' },
    { icon: LockKeyhole, title: 'Secure Investments', text: 'Two-step sign-in, maker-checker approvals and a complete audit trail for every action.' },
    { icon: Clock3, title: 'Real Time Updates', text: 'Live order book, instant bid confirmation and automatic notifications on every change.' },
    { icon: Globe2, title: 'Broad Access', text: 'Retail, QII and Non-QII investors subscribe to equities, fixed income and more online.' },
];

/** Marketing landing page (legacy welcome.blade.php), rebuilt with the platform palette. */
export default function Welcome({ stats }: { stats?: { live_offers?: number; sponsors?: number } }) {
    return (
        <div className="bg-background flex min-h-svh flex-col">
            <Head title="Connecting Opportunities, Empowering Investments" />
            <header className="border-b">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
                    <Link href={route('home')} className="flex items-center gap-3">
                        <AppLogoIcon className="h-9" />
                        <span className="text-navy hidden text-sm font-semibold sm:inline dark:text-white">e-Offering Platform</span>
                    </Link>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href={route('login')}>Sign in</Link>
                        </Button>
                        <Button asChild>
                            <Link href={route('onboarding.choose')}>Register</Link>
                        </Button>
                    </div>
                </div>
            </header>

            <section className="bg-navy relative overflow-hidden text-white">
                <div aria-hidden className="border-gold pointer-events-none absolute -right-32 -bottom-48 size-[480px] rounded-full border-[32px] opacity-80" />
                <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
                    <div>
                        <p className="text-gold text-xs font-semibold tracking-[0.25em] uppercase">FMDQ e-Offering</p>
                        <h1 className="mt-4 text-4xl leading-tight font-semibold md:text-5xl">Connecting Opportunities, Empowering Investments</h1>
                        <p className="mt-5 max-w-lg text-white/80">
                            An end-to-end digital channel for the distribution of equity and fixed-income securities: offer creation, investor
                            subscription, book building, allotment, regulatory review and depository lodgement.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Button size="lg" className="bg-gold text-navy-dark hover:bg-gold-light" asChild>
                                <Link href={route('onboarding.choose')}>
                                    Get started <ArrowRight className="size-4" />
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white" asChild>
                                <Link href={route('login')}>Sign in</Link>
                            </Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 content-center gap-4">
                        <div className="rounded-2xl bg-white/10 p-6 backdrop-blur">
                            <Landmark className="text-gold size-6" />
                            <p className="mt-4 text-3xl font-semibold">{stats?.live_offers ?? 0}</p>
                            <p className="text-sm text-white/70">Offers on the platform</p>
                        </div>
                        <div className="rounded-2xl bg-white/10 p-6 backdrop-blur">
                            <UsersRound className="text-gold size-6" />
                            <p className="mt-4 text-3xl font-semibold">{stats?.sponsors ?? 0}</p>
                            <p className="text-sm text-white/70">Registered sponsors</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto w-full max-w-6xl px-4 py-16">
                <h2 className="text-navy text-center text-2xl font-semibold dark:text-white">Why FMDQ e-Offering?</h2>
                <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {why.map(({ icon: Icon, title, text }, i) => (
                        <div key={title} className={i % 2 === 0 ? 'bg-navy rounded-2xl p-6 text-white' : 'bg-gold text-navy-dark rounded-2xl p-6'}>
                            <Icon className="size-7" />
                            <h3 className="mt-4 font-semibold">{title}</h3>
                            <p className="mt-2 text-sm opacity-85">{text}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="bg-muted/50 border-y">
                <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 md:grid-cols-2">
                    <div className="bg-card rounded-2xl border p-8">
                        <h3 className="text-navy text-xl font-semibold dark:text-white">Sponsors</h3>
                        <p className="text-muted-foreground mt-2 text-sm">
                            Stockbrokers, registrars, banks and other FMDQ-registered parties create offers, run the book and allot online.
                        </p>
                        <Button className="mt-6" asChild>
                            <Link href={route('onboarding.form', 'tsp')}>Get started as a sponsor</Link>
                        </Button>
                    </div>
                    <div className="bg-card rounded-2xl border p-8">
                        <h3 className="text-navy text-xl font-semibold dark:text-white">Investors</h3>
                        <p className="text-muted-foreground mt-2 text-sm">
                            Retail investors, QIIs and Non-QIIs browse offers, bid, track payments and see their allotments in one place.
                        </p>
                        <Button className="mt-6" variant="secondary" asChild>
                            <Link href={route('onboarding.choose')}>Get started as an investor</Link>
                        </Button>
                    </div>
                </div>
            </section>

            <AppFooter />
        </div>
    );
}
