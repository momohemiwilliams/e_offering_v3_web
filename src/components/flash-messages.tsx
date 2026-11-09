import { type SharedData } from '@/types';
import { usePage } from '@/lib/app';
import { CheckCircle2, X, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export function FlashMessages() {
    const { flash } = usePage<SharedData>().props;
    const [visible, setVisible] = useState(true);
    const message = flash?.success ?? flash?.error;
    const isError = !flash?.success && !!flash?.error;

    useEffect(() => {
        setVisible(true);
        if (!message) return;
        const t = setTimeout(() => setVisible(false), 6000);
        return () => clearTimeout(t);
    }, [message, flash]);

    if (!message || !visible) return null;

    return (
        <div className="px-4 pt-4">
            <div
                role="status"
                className={
                    isError
                        ? 'flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200'
                        : 'flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                }
            >
                {isError ? <XCircle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0" />}
                <p className="flex-1">{message}</p>
                <button type="button" onClick={() => setVisible(false)} className="opacity-70 hover:opacity-100" aria-label="Dismiss">
                    <X className="size-4" />
                </button>
            </div>
        </div>
    );
}
