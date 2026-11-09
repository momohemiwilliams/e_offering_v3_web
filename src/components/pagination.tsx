import { Button } from '@/components/ui/button';
import { type Paginated } from '@/types';
import { Link } from '@/lib/app';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({ paginator }: { paginator: Paginated<unknown> }) {
    if (paginator.last_page <= 1) return null;

    const prev = paginator.links[0];
    const next = paginator.links[paginator.links.length - 1];

    return (
        <div className="text-muted-foreground flex items-center justify-between gap-4 px-4 py-3 text-sm">
            <p>
                Showing {paginator.from ?? 0}–{paginator.to ?? 0} of {paginator.total}
            </p>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild disabled={!prev.url}>
                    <Link
                        href={prev.url ?? '#'}
                        preserveScroll
                        preserveState
                        aria-disabled={!prev.url}
                        className={!prev.url ? 'pointer-events-none opacity-50' : ''}
                    >
                        <ChevronLeft /> Previous
                    </Link>
                </Button>
                <span>
                    Page {paginator.current_page} of {paginator.last_page}
                </span>
                <Button variant="outline" size="sm" asChild disabled={!next.url}>
                    <Link
                        href={next.url ?? '#'}
                        preserveScroll
                        preserveState
                        aria-disabled={!next.url}
                        className={!next.url ? 'pointer-events-none opacity-50' : ''}
                    >
                        Next <ChevronRight />
                    </Link>
                </Button>
            </div>
        </div>
    );
}
