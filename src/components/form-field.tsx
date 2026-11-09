import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ChangeEvent, type ReactNode, useId } from 'react';

/** Label + control + hint + inline error (legacy forms only showed errors in pop-ups). */
export function Field({
    label,
    error,
    hint,
    required,
    children,
    className,
    htmlFor,
}: {
    label: ReactNode;
    error?: string;
    hint?: ReactNode;
    required?: boolean;
    children: ReactNode;
    className?: string;
    htmlFor?: string;
}) {
    return (
        <div className={cn('grid gap-1.5', className)}>
            <Label htmlFor={htmlFor}>
                {label}
                {required && <span className="text-destructive"> *</span>}
            </Label>
            {children}
            {hint && !error && <p className="text-muted-foreground text-xs">{hint}</p>}
            <InputError message={error} />
        </div>
    );
}

export function TextField({
    label,
    value,
    onChange,
    error,
    hint,
    required,
    type = 'text',
    placeholder,
    className,
    ...rest
}: {
    label: ReactNode;
    value: string | number | null | undefined;
    onChange: (value: string) => void;
    error?: string;
    hint?: ReactNode;
    required?: boolean;
    type?: string;
    placeholder?: string;
    className?: string;
    [key: string]: unknown;
}) {
    const id = useId();
    return (
        <Field label={label} error={error} hint={hint} required={required} className={className} htmlFor={id}>
            <Input
                id={id}
                type={type}
                value={value ?? ''}
                required={required}
                placeholder={placeholder}
                aria-invalid={!!error}
                onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
                {...rest}
            />
        </Field>
    );
}

/** Naira amount with live thousands separators (the legacy number inputs broke on commas). */
export function MoneyField({
    label,
    value,
    onChange,
    error,
    hint,
    required,
    prefix = '₦',
    className,
}: {
    label: ReactNode;
    value: string | number | null | undefined;
    onChange: (value: string) => void;
    error?: string;
    hint?: ReactNode;
    required?: boolean;
    prefix?: string;
    className?: string;
}) {
    const id = useId();
    const raw = String(value ?? '').replace(/,/g, '');
    const [whole, frac] = raw.split('.');
    const display = whole === '' ? '' : Number(whole).toLocaleString('en-US') + (frac !== undefined ? '.' + frac : '');

    return (
        <Field label={label} error={error} hint={hint} required={required} className={className} htmlFor={id}>
            <div className="relative">
                <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">{prefix}</span>
                <Input
                    id={id}
                    inputMode="decimal"
                    className="pl-8 tabular-nums"
                    value={Number.isNaN(Number(whole)) ? raw : display}
                    required={required}
                    aria-invalid={!!error}
                    onChange={(e) => {
                        const next = e.target.value.replace(/[^\d.]/g, '');
                        const parts = next.split('.');
                        onChange(parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : next);
                    }}
                />
            </div>
        </Field>
    );
}

export function SelectField({
    label,
    value,
    onChange,
    options,
    error,
    hint,
    required,
    placeholder = 'Select…',
    className,
}: {
    label: ReactNode;
    value: string | number | null | undefined;
    onChange: (value: string) => void;
    options: { value: string | number; label: string }[];
    error?: string;
    hint?: ReactNode;
    required?: boolean;
    placeholder?: string;
    className?: string;
}) {
    const id = useId();
    return (
        <Field label={label} error={error} hint={hint} required={required} className={className} htmlFor={id}>
            <select
                id={id}
                value={value ?? ''}
                required={required}
                aria-invalid={!!error}
                onChange={(e) => onChange(e.target.value)}
                className="border-input bg-background focus-visible:ring-ring/50 flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] aria-invalid:border-rose-400"
            >
                <option value="">{placeholder}</option>
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
        </Field>
    );
}

/** File picker that shows the chosen file name and the accepted types / size. */
export function FileField({
    label,
    onChange,
    error,
    hint,
    required,
    accept = '.pdf,.jpg,.jpeg,.png',
    file,
    className,
}: {
    label: ReactNode;
    onChange: (file: File | null) => void;
    error?: string;
    hint?: ReactNode;
    required?: boolean;
    accept?: string;
    file?: File | null;
    className?: string;
}) {
    const id = useId();
    return (
        <Field label={label} error={error} hint={hint} required={required} className={className} htmlFor={id}>
            <label
                htmlFor={id}
                className={cn(
                    'hover:border-navy/50 flex cursor-pointer items-center gap-3 rounded-md border border-dashed px-3 py-2.5 text-sm transition',
                    error && 'border-rose-400',
                )}
            >
                <span className="bg-navy/10 text-navy rounded px-2 py-1 text-xs font-medium dark:text-white">Choose file</span>
                <span className="text-muted-foreground truncate">{file ? file.name : 'No file selected'}</span>
            </label>
            <input id={id} type="file" accept={accept} className="sr-only" onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
        </Field>
    );
}
