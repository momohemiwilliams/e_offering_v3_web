import { cn } from '@/lib/utils';
import { Link } from '@/lib/app';
import { ArrowUpRight, type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';

interface StatCardProps {
    label: string;
    value: ReactNode;
    hint?: ReactNode;
    icon?: LucideIcon;
    /** Legacy KPI cards alternate navy and gold; "plain" is a white card. */
    variant?: 'navy' | 'gold' | 'plain';
    href?: string;
}

const variants = {
    navy: 'bg-navy text-white border-transparent',
    gold: 'bg-gold text-navy-dark border-transparent',
    plain: 'bg-card text-card-foreground',
};

export function StatCard({ label, value, hint, icon: Icon, variant = 'plain', href }: StatCardProps) {
    const body = (
        <div
            className={cn(
                'group relative h-full overflow-hidden rounded-xl border p-5 shadow-xs transition',
                variants[variant],
                href && 'hover:-translate-y-0.5 hover:shadow-md',
            )}
        >
            {variant !== 'plain' && (
                <span aria-hidden className="pointer-events-none absolute -right-8 -bottom-10 size-28 rounded-full border-[14px] border-white/15" />
            )}
            <div className={cn('flex items-start justify-between gap-3 text-sm font-medium', variant === 'plain' ? 'text-muted-foreground' : 'text-current/85')}>
                <span>{label}</span>
                {href ? <ArrowUpRight className="size-4 opacity-70" /> : Icon && <Icon className="size-4 opacity-80" />}
            </div>
            <div className="mt-3 text-2xl font-semibold tracking-tight tabular-nums md:text-[28px]">{value}</div>
            {hint && <div className={cn('mt-1 text-xs', variant === 'plain' ? 'text-muted-foreground' : 'text-current/75')}>{hint}</div>}
        </div>
    );

    return href ? (
        <Link href={href} className="block h-full focus-visible:outline-none">
            {body}
        </Link>
    ) : (
        body
    );
}
