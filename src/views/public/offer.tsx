import { DetailList } from '@/components/section';
import { Button } from '@/components/ui/button';
import AuthBrandLayout from '@/layouts/auth/auth-brand-layout';
import { Head, Link } from '@/lib/app';
import { formatDateTime, formatMoney } from '@/lib/format';

interface PublicOffer {
    reference: string;
    issuer_name: string;
    issuer_type: string;
    issue_description: string;
    issue_series: string | null;
    offer_size: string;
    open_at: string;
    close_at: string;
    tenor: string | null;
    rate: string | null;
    rate_min: string | null;
    rate_max: string | null;
    issue_price: string | null;
    min_subscription_amount: string;
    security_type_label: string;
    rate_label: string;
    price_discovery_label: string;
    sponsor: string | null;
    co_sponsors: string[];
}

/** Shareable page with an offer's published terms; no sign-in needed. */
export default function PublicOfferPage({ offer }: { offer: PublicOffer }) {
    const rate = offer.rate ?? (offer.rate_min ? `${offer.rate_min} to ${offer.rate_max}` : 'Set at book building');

    return (
        <AuthBrandLayout title={offer.issuer_name} description={`${offer.security_type_label} · ${offer.reference}`} wide>
            <Head title={offer.issuer_name} />
            <DetailList
                columns={2}
                items={[
                    { label: 'Issue', value: offer.issue_series ? `${offer.issue_description} (${offer.issue_series})` : offer.issue_description, wide: true },
                    { label: 'Issuer type', value: offer.issuer_type },
                    { label: 'Offer size', value: `Up to ${formatMoney(offer.offer_size)}` },
                    { label: 'Opens', value: formatDateTime(offer.open_at) },
                    { label: 'Closes', value: formatDateTime(offer.close_at) },
                    { label: 'Price discovery', value: offer.price_discovery_label },
                    { label: offer.rate_label, value: rate },
                    { label: 'Issue price per unit', value: offer.issue_price },
                    { label: 'Minimum subscription', value: formatMoney(offer.min_subscription_amount) },
                    { label: 'Tenor', value: offer.tenor },
                    { label: 'Transaction sponsor', value: offer.sponsor },
                    { label: 'Co-sponsors', value: offer.co_sponsors.join(', '), wide: true },
                ]}
            />
            <Button asChild className="mt-6 w-full">
                <Link href={route('login')}>Sign in to subscribe</Link>
            </Button>
            <p className="text-muted-foreground mt-3 text-center text-sm">
                New to e-Offering?{' '}
                <Link href={route('onboarding.choose')} className="text-navy dark:text-gold-light font-medium hover:underline">
                    Create an account
                </Link>
            </p>
        </AuthBrandLayout>
    );
}
