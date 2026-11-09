import { EmptyState } from '@/components/empty-state';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp, ArrowUpDown, Inbox, Search } from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';

export interface Column<T> {
    key: string;
    header: ReactNode;
    cell: (row: T, index: number) => ReactNode;
    /** Value used for sorting and searching. */
    value?: (row: T) => string | number | null | undefined;
    align?: 'left' | 'right' | 'center';
    className?: string;
    sortable?: boolean;
}

/**
 * Client-side table (replaces the legacy jQuery DataTables): search, sortable headers,
 * sticky header, left-aligned text with right-aligned numbers, horizontal scroll on small screens.
 */
export function DataTable<T>({
    rows,
    columns,
    rowKey,
    searchable = false,
    searchPlaceholder = 'Search…',
    emptyTitle = 'Nothing here yet',
    emptyDescription,
    footer,
    rowClassName,
    toolbar,
    pageSize = 0,
}: {
    rows: T[];
    columns: Column<T>[];
    rowKey: (row: T) => string | number;
    searchable?: boolean;
    searchPlaceholder?: string;
    emptyTitle?: string;
    emptyDescription?: string;
    footer?: ReactNode;
    rowClassName?: (row: T) => string | undefined;
    toolbar?: ReactNode;
    /** 0 = show all rows. */
    pageSize?: number;
}) {
    const [term, setTerm] = useState('');
    const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);
    const [page, setPage] = useState(0);

    const filtered = useMemo(() => {
        let out = rows;
        if (term.trim()) {
            const t = term.trim().toLowerCase();
            out = out.filter((row) =>
                columns.some((c) => {
                    const v = c.value ? c.value(row) : null;
                    return v !== null && v !== undefined && String(v).toLowerCase().includes(t);
                }),
            );
        }
        if (sort) {
            const col = columns.find((c) => c.key === sort.key);
            if (col?.value) {
                out = [...out].sort((a, b) => {
                    const va = col.value!(a);
                    const vb = col.value!(b);
                    if (va === vb) return 0;
                    if (va === null || va === undefined) return 1;
                    if (vb === null || vb === undefined) return -1;
                    const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb));
                    return sort.dir === 'asc' ? cmp : -cmp;
                });
            }
        }
        return out;
    }, [rows, columns, term, sort]);

    const pages = pageSize > 0 ? Math.max(1, Math.ceil(filtered.length / pageSize)) : 1;
    const visible = pageSize > 0 ? filtered.slice(page * pageSize, page * pageSize + pageSize) : filtered;

    const toggle = (key: string) => {
        setSort((s) => (s?.key !== key ? { key, dir: 'asc' } : s.dir === 'asc' ? { key, dir: 'desc' } : null));
    };

    return (
        <div>
            {(searchable || toolbar) && (
                <div className="flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    {searchable ? (
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                            <Input
                                value={term}
                                onChange={(e) => {
                                    setTerm(e.target.value);
                                    setPage(0);
                                }}
                                placeholder={searchPlaceholder}
                                className="pl-8"
                                aria-label="Search table"
                            />
                        </div>
                    ) : (
                        <span />
                    )}
                    {toolbar && <div className="flex flex-wrap items-center gap-2">{toolbar}</div>}
                </div>
            )}
            {visible.length === 0 ? (
                <EmptyState icon={Inbox} title={term ? 'No matching records' : emptyTitle} description={term ? undefined : emptyDescription} />
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/60 sticky top-0 z-[1]">
                            <tr className="border-b">
                                {columns.map((c) => {
                                    const sortable = c.sortable !== false && !!c.value;
                                    const active = sort?.key === c.key;
                                    return (
                                        <th
                                            key={c.key}
                                            scope="col"
                                            className={cn(
                                                'text-muted-foreground px-4 py-2.5 text-xs font-semibold tracking-wide whitespace-nowrap uppercase',
                                                c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left',
                                                c.className,
                                            )}
                                            aria-sort={active ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                                        >
                                            {sortable ? (
                                                <button type="button" onClick={() => toggle(c.key)} className="hover:text-foreground inline-flex items-center gap-1">
                                                    {c.header}
                                                    {active ? (
                                                        sort!.dir === 'asc' ? (
                                                            <ArrowUp className="size-3" />
                                                        ) : (
                                                            <ArrowDown className="size-3" />
                                                        )
                                                    ) : (
                                                        <ArrowUpDown className="size-3 opacity-40" />
                                                    )}
                                                </button>
                                            ) : (
                                                c.header
                                            )}
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map((row, i) => (
                                <tr key={rowKey(row)} className={cn('hover:bg-muted/40 border-b last:border-0', rowClassName?.(row))}>
                                    {columns.map((c) => (
                                        <td
                                            key={c.key}
                                            className={cn(
                                                'px-4 py-3 align-top',
                                                c.align === 'right' ? 'text-right tabular-nums' : c.align === 'center' ? 'text-center' : 'text-left',
                                                c.className,
                                            )}
                                        >
                                            {c.cell(row, i)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                        {footer && <tfoot className="bg-muted/40 border-t font-medium">{footer}</tfoot>}
                    </table>
                </div>
            )}
            {pageSize > 0 && pages > 1 && (
                <div className="text-muted-foreground flex items-center justify-between px-4 py-3 text-sm">
                    <span>
                        Showing {page * pageSize + 1}–{Math.min(filtered.length, (page + 1) * pageSize)} of {filtered.length}
                    </span>
                    <div className="flex gap-2">
                        <button type="button" className="rounded border px-2 py-1 disabled:opacity-40" disabled={page === 0} onClick={() => setPage(page - 1)}>
                            Previous
                        </button>
                        <button type="button" className="rounded border px-2 py-1 disabled:opacity-40" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
