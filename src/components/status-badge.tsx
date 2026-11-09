import { type Tone } from '@/lib/labels';
import { cn } from '@/lib/utils';

const tones: Record<Tone, string> = {
    neutral: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300',
    info: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
    warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
    danger: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300',
    navy: 'border-navy/20 bg-navy/10 text-navy dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200',
    gold: 'border-gold/40 bg-gold/15 text-[#8a6a2c] dark:text-gold-light',
};

const dots: Record<Tone, string> = {
    neutral: 'bg-slate-400',
    info: 'bg-sky-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    navy: 'bg-navy',
    gold: 'bg-gold',
};

/**
 * Status pill driven by a label map from lib/labels.ts, e.g.
 * <StatusBadge map={paymentStatus} value={bid.payment_status} />.
 * Colour is paired with a dot and text so status never relies on colour alone.
 */
export function StatusBadge({
    map,
    value,
    className,
}: {
    map: Record<string, { label: string; tone: Tone }>;
    value: string | null | undefined;
    className?: string;
}) {
    const entry = (value && map[value]) || { label: value ? value.replace(/_/g, ' ') : '—', tone: 'neutral' as Tone };

    return (
        <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap', tones[entry.tone], className)}>
            <span className={cn('size-1.5 rounded-full', dots[entry.tone])} aria-hidden />
            {entry.label}
        </span>
    );
}

export function ToneBadge({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
    return <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium', tones[tone], className)}>{children}</span>;
}
