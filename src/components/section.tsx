import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

/**
 * Card section in the legacy ".offer-report-table" style: title + description header,
 * optional actions, body. The `flush` variant removes body padding for tables.
 */
export function Section({
    title,
    description,
    actions,
    children,
    flush = false,
    className,
    id,
}: {
    title?: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    children: ReactNode;
    flush?: boolean;
    className?: string;
    id?: string;
}) {
    return (
        <section id={id} className={cn('bg-card overflow-hidden rounded-xl border shadow-xs', className)}>
            {(title || actions) && (
                <div className="flex flex-col gap-2 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        {title && <h2 className="text-navy text-base font-semibold dark:text-white">{title}</h2>}
                        {description && <p className="text-muted-foreground mt-0.5 text-sm">{description}</p>}
                    </div>
                    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
                </div>
            )}
            <div className={flush ? '' : 'p-5'}>{children}</div>
        </section>
    );
}

/** Label / value grid for record details. */
export function DetailList({ items, columns = 2 }: { items: { label: string; value: ReactNode; wide?: boolean }[]; columns?: 2 | 3 | 4 }) {
    const cols = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' }[columns];
    return (
        <dl className={cn('grid grid-cols-1 gap-x-6 gap-y-4', cols)}>
            {items.map((item) => (
                <div key={item.label} className={cn('min-w-0', item.wide && 'sm:col-span-full')}>
                    <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{item.label}</dt>
                    <dd className="mt-1 text-sm break-words">{item.value === null || item.value === undefined || item.value === '' ? '—' : item.value}</dd>
                </div>
            ))}
        </dl>
    );
}

/** Page wrapper: consistent padding and vertical rhythm. */
export function Page({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn('flex flex-1 flex-col gap-6 p-4 md:p-6', className)}>{children}</div>;
}

/** Numbered progress steps (legacy ".reg-steps" stepper). */
export function Steps({ steps, current }: { steps: string[]; current: number }) {
    return (
        <ol className="flex flex-wrap items-center gap-2 text-sm">
            {steps.map((step, i) => {
                const state = i < current ? 'done' : i === current ? 'active' : 'todo';
                return (
                    <li key={step} className="flex items-center gap-2">
                        <span
                            className={cn(
                                'flex size-7 items-center justify-center rounded-full border text-xs font-semibold',
                                state === 'done' && 'bg-navy border-navy text-white',
                                state === 'active' && 'border-gold bg-gold/15 text-navy dark:text-gold-light',
                                state === 'todo' && 'text-muted-foreground',
                            )}
                        >
                            {i + 1}
                        </span>
                        <span className={cn(state === 'todo' ? 'text-muted-foreground' : 'font-medium')}>{step}</span>
                        {i < steps.length - 1 && <span className="bg-border mx-1 hidden h-px w-8 sm:block" />}
                    </li>
                );
            })}
        </ol>
    );
}
