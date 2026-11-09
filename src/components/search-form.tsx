import { Input } from '@/components/ui/input';
import { router } from '@/lib/app';
import { Search } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

interface SearchFormProps {
    url: string;
    initial?: string;
    placeholder?: string;
    extra?: Record<string, string | undefined>;
    /** Delay before a keystroke triggers a search, in milliseconds. */
    debounce?: number;
}

export function SearchForm({ url, initial = '', placeholder = 'Search…', extra = {}, debounce = 300 }: SearchFormProps) {
    const [value, setValue] = useState(initial);
    const lastSearched = useRef(initial);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const search = (term: string) => {
        if (timer.current) clearTimeout(timer.current);
        if (term === lastSearched.current) return;
        lastSearched.current = term;
        router.get(url, { ...extra, search: term || undefined }, { preserveState: true, preserveScroll: true, replace: true });
    };

    // Search as the user types, after a short pause.
    useEffect(() => {
        if (value === lastSearched.current) return;
        timer.current = setTimeout(() => search(value), debounce);
        return () => clearTimeout(timer.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const submit = (e: FormEvent) => {
        e.preventDefault();
        search(value);
    };

    return (
        <form onSubmit={submit} className="relative w-full max-w-sm">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} className="pl-9" aria-label={placeholder} />
        </form>
    );
}
