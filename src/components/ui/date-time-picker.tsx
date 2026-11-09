import { Button } from '@/components/ui/button';
import { formatDate, formatDateOf, formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react';
import { KeyboardEvent, MouseEvent, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Custom date / date-time picker.
 *
 * Values are plain strings in the same shape a native `datetime-local`
 * (`YYYY-MM-DDTHH:mm`) or `date` (`YYYY-MM-DD`) input would produce, so the
 * server-side validation and the rest of the form code stay unchanged.
 */
export interface DateTimePickerProps {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    /** Show hour / minute controls. Defaults to true. */
    withTime?: boolean;
    /** Earliest selectable value (same string format). */
    min?: string;
    /** Latest selectable value (same string format). */
    max?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    'aria-invalid'?: boolean;
    'aria-describedby'?: string;
}

interface Parts {
    y: number;
    m: number; // 1-12
    d: number;
    h: number;
    mi: number;
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DEFAULT_HOUR = 9;

const pad = (n: number) => String(n).padStart(2, '0');

export function parseDateTimeValue(value: string | null | undefined): Parts | null {
    if (!value) return null;
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
    if (!m) return null;
    return { y: +m[1], m: +m[2], d: +m[3], h: m[4] ? +m[4] : DEFAULT_HOUR, mi: m[5] ? +m[5] : 0 };
}

export function formatDateTimeValue(p: Parts, withTime: boolean): string {
    const date = `${p.y}-${pad(p.m)}-${pad(p.d)}`;
    return withTime ? `${date}T${pad(p.h)}:${pad(p.mi)}` : date;
}

const toDate = (p: Parts) => new Date(p.y, p.m - 1, p.d, p.h, p.mi);
const fromDate = (d: Date): Parts => ({ y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate(), h: d.getHours(), mi: d.getMinutes() });
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const sameDay = (a: Date | null, b: Date | null) => !!a && !!b && ymd(a) === ymd(b);

function buildGrid(year: number, month: number): Date[] {
    // month is 0-based here. Grid is Monday-first, always 6 rows.
    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(year, month, 1 - offset);
    return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

const selectClass =
    'h-9 rounded-md border border-input bg-background px-2 text-sm tabular-nums ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden';

export function DateTimePicker({
    id,
    value,
    onChange,
    withTime = true,
    min,
    max,
    placeholder,
    required = false,
    disabled = false,
    className,
    ...aria
}: DateTimePickerProps) {
    const selected = useMemo(() => parseDateTimeValue(value), [value]);
    const minDate = useMemo(() => {
        const p = parseDateTimeValue(min);
        return p ? toDate(p) : null;
    }, [min]);
    const maxDate = useMemo(() => {
        const p = parseDateTimeValue(max);
        return p ? toDate(p) : null;
    }, [max]);

    const label = selected
        ? withTime
            ? formatDateTime(value)
            : formatDate(value)
        : (placeholder ?? (withTime ? 'Pick a date and time' : 'Pick a date'));

    const clear = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onChange('');
    };

    return (
        <Popover className={cn('relative', className)}>
            <div className="relative">
                <PopoverButton
                    id={id}
                    disabled={disabled}
                    aria-invalid={aria['aria-invalid']}
                    aria-describedby={aria['aria-describedby']}
                    className={cn(
                        'flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-left text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive',
                        !selected && 'text-muted-foreground',
                        selected && !required && 'pr-9',
                    )}
                >
                    <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate">{label}</span>
                </PopoverButton>
                {selected && !required && !disabled && (
                    <button
                        type="button"
                        onClick={clear}
                        aria-label="Clear"
                        className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                        <X className="size-4" />
                    </button>
                )}
            </div>

            <PopoverPanel
                anchor="bottom start"
                transition
                className="z-50 w-[19.5rem] rounded-lg border bg-popover p-3 text-popover-foreground shadow-md transition duration-150 ease-out [--anchor-gap:6px] data-[closed]:scale-95 data-[closed]:opacity-0"
            >
                {({ close }) => (
                    <PickerPanel
                        selected={selected}
                        withTime={withTime}
                        minDate={minDate}
                        maxDate={maxDate}
                        required={required}
                        onChange={onChange}
                        close={close}
                    />
                )}
            </PopoverPanel>
        </Popover>
    );
}

interface PanelProps {
    selected: Parts | null;
    withTime: boolean;
    minDate: Date | null;
    maxDate: Date | null;
    required: boolean;
    onChange: (value: string) => void;
    close: () => void;
}

function PickerPanel({ selected, withTime, minDate, maxDate, required, onChange, close }: PanelProps) {
    const today = useMemo(() => new Date(), []);
    const selectedDate = selected ? toDate(selected) : null;

    const [view, setView] = useState(() => {
        const base = selectedDate ?? today;
        return { year: base.getFullYear(), month: base.getMonth() };
    });
    const [focused, setFocused] = useState<Date>(() => selectedDate ?? today);
    const gridRef = useRef<HTMLDivElement>(null);

    const days = useMemo(() => buildGrid(view.year, view.month), [view]);

    // Keep keyboard focus on the focused day while navigating with arrows.
    useEffect(() => {
        const grid = gridRef.current;
        if (!grid || !grid.contains(document.activeElement)) return;
        grid.querySelector<HTMLButtonElement>(`[data-date="${ymd(focused)}"]`)?.focus();
    }, [focused]);

    const isDisabled = (d: Date) => {
        if (minDate && ymd(d) < ymd(minDate)) return true;
        if (maxDate && ymd(d) > ymd(maxDate)) return true;
        return false;
    };

    // With a time, min / max are full date-times: on the boundary day the earlier (or later)
    // times are out of range too, not just the earlier days.
    const tooEarly = (dt: Date) => withTime && !!minDate && dt.getTime() < minDate.getTime();
    const tooLate = (dt: Date) => withTime && !!maxDate && dt.getTime() > maxDate.getTime();

    /** Pull a value back inside [min, max]; a value before min moves to min, rounded up to the next 5 minutes. */
    const clamp = (p: Parts): Parts => {
        if (!withTime) return p;
        const dt = toDate(p);
        if (minDate && dt.getTime() < minDate.getTime()) {
            const up = new Date(minDate.getTime());
            const rem = up.getMinutes() % 5;
            if (rem) up.setMinutes(up.getMinutes() + (5 - rem));
            return fromDate(maxDate && up.getTime() > maxDate.getTime() ? minDate : up);
        }
        if (maxDate && dt.getTime() > maxDate.getTime()) return fromDate(maxDate);
        return p;
    };

    const emit = (p: Parts) => onChange(formatDateTimeValue(clamp(p), withTime));

    const selectDay = (d: Date) => {
        emit({ y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate(), h: selected?.h ?? DEFAULT_HOUR, mi: selected?.mi ?? 0 });
        if (!withTime) close();
    };

    /** The day the time controls apply to: the selected day, or today before anything is picked. */
    const timeBase = selected ?? fromDate(today);
    const at = (h: number, mi: number) => new Date(timeBase.y, timeBase.m - 1, timeBase.d, h, mi);
    const minuteOff = (h: number, mi: number) => tooEarly(at(h, mi)) || tooLate(at(h, mi));
    // An hour (or half-day) is unavailable only when none of its minutes are in range.
    const hourOff = (h: number) => tooEarly(at(h, 59)) || tooLate(at(h, 0));
    const halfDayOff = (pm: boolean) => tooEarly(at(pm ? 23 : 11, 59)) || tooLate(at(pm ? 12 : 0, 0));

    const setTime = (h: number, mi: number) => {
        emit({ ...timeBase, h, mi });
    };

    const moveFocus = (d: Date) => {
        setFocused(d);
        if (d.getMonth() !== view.month || d.getFullYear() !== view.year) {
            setView({ year: d.getFullYear(), month: d.getMonth() });
        }
    };

    const shiftMonth = (delta: number) => {
        const next = new Date(view.year, view.month + delta, 1);
        setView({ year: next.getFullYear(), month: next.getMonth() });
    };

    const onGridKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        const f = focused;
        const step = (days: number) => new Date(f.getFullYear(), f.getMonth(), f.getDate() + days);
        const map: Record<string, () => Date> = {
            ArrowLeft: () => step(-1),
            ArrowRight: () => step(1),
            ArrowUp: () => step(-7),
            ArrowDown: () => step(7),
            Home: () => step(-((f.getDay() + 6) % 7)),
            End: () => step(6 - ((f.getDay() + 6) % 7)),
            PageUp: () => new Date(f.getFullYear(), f.getMonth() - (e.shiftKey ? 12 : 1), f.getDate()),
            PageDown: () => new Date(f.getFullYear(), f.getMonth() + (e.shiftKey ? 12 : 1), f.getDate()),
        };
        const handler = map[e.key];
        if (handler) {
            e.preventDefault();
            moveFocus(handler());
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!isDisabled(f)) selectDay(f);
        }
    };

    const hour24 = selected?.h ?? DEFAULT_HOUR;
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
    const meridiem: 'AM' | 'PM' = hour24 >= 12 ? 'PM' : 'AM';
    const minute = selected?.mi ?? 0;

    const to24 = (h12: number, mer: 'AM' | 'PM') => (mer === 'PM' ? (h12 % 12) + 12 : h12 % 12);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => shiftMonth(-1)} aria-label="Previous month">
                    <ChevronLeft />
                </Button>
                <div className="flex items-center gap-1">
                    <select
                        aria-label="Month"
                        className={cn(selectClass, 'h-8')}
                        value={view.month}
                        onChange={(e) => setView({ ...view, month: +e.target.value })}
                    >
                        {MONTHS.map((m, i) => (
                            <option key={m} value={i}>
                                {m}
                            </option>
                        ))}
                    </select>
                    <select
                        aria-label="Year"
                        className={cn(selectClass, 'h-8')}
                        value={view.year}
                        onChange={(e) => setView({ ...view, year: +e.target.value })}
                    >
                        {Array.from({ length: 21 }, (_, i) => today.getFullYear() - 5 + i).map((y) => (
                            <option key={y} value={y}>
                                {y}
                            </option>
                        ))}
                    </select>
                </div>
                <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => shiftMonth(1)} aria-label="Next month">
                    <ChevronRight />
                </Button>
            </div>

            <div ref={gridRef} role="grid" aria-label="Calendar" onKeyDown={onGridKeyDown} className="grid grid-cols-7 gap-y-1 text-center text-sm">
                {WEEKDAYS.map((w) => (
                    <div key={w} role="columnheader" className="pb-1 text-xs font-medium text-muted-foreground">
                        {w}
                    </div>
                ))}
                {days.map((d) => {
                    const inMonth = d.getMonth() === view.month;
                    const isSelected = sameDay(d, selectedDate);
                    const isToday = sameDay(d, today);
                    const isFocused = sameDay(d, focused);
                    const off = isDisabled(d);
                    return (
                        <button
                            key={ymd(d)}
                            type="button"
                            role="gridcell"
                            data-date={ymd(d)}
                            tabIndex={isFocused ? 0 : -1}
                            disabled={off}
                            aria-selected={isSelected}
                            aria-label={formatDateOf(d)}
                            onClick={() => {
                                setFocused(d);
                                selectDay(d);
                            }}
                            className={cn(
                                'mx-auto flex size-8 items-center justify-center rounded-md tabular-nums transition-colors',
                                !inMonth && 'text-muted-foreground/50',
                                !off && 'hover:bg-accent hover:text-accent-foreground',
                                off && 'cursor-not-allowed opacity-30',
                                isToday && !isSelected && 'font-semibold text-primary underline underline-offset-4',
                                isSelected && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden',
                            )}
                        >
                            {d.getDate()}
                        </button>
                    );
                })}
            </div>

            {withTime && (
                <div className="flex items-center gap-2 border-t pt-3">
                    <Clock className="size-4 text-muted-foreground" />
                    <select aria-label="Hour" className={selectClass} value={hour12} onChange={(e) => setTime(to24(+e.target.value, meridiem), minute)}>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                            <option key={h} value={h} disabled={hourOff(to24(h, meridiem))}>
                                {pad(h)}
                            </option>
                        ))}
                    </select>
                    <span className="text-muted-foreground">:</span>
                    <select aria-label="Minute" className={selectClass} value={minute} onChange={(e) => setTime(hour24, +e.target.value)}>
                        {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                            <option key={m} value={m} disabled={minuteOff(hour24, m)}>
                                {pad(m)}
                            </option>
                        ))}
                    </select>
                    <select
                        aria-label="AM or PM"
                        className={selectClass}
                        value={meridiem}
                        onChange={(e) => setTime(to24(hour12, e.target.value as 'AM' | 'PM'), minute)}
                    >
                        <option value="AM" disabled={halfDayOff(false)}>
                            AM
                        </option>
                        <option value="PM" disabled={halfDayOff(true)}>
                            PM
                        </option>
                    </select>
                </div>
            )}

            <div className="flex items-center justify-between border-t pt-3">
                <div className="flex gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            const now = fromDate(today);
                            emit(withTime ? now : { ...now, h: DEFAULT_HOUR, mi: 0 });
                            moveFocus(today);
                        }}
                    >
                        {withTime ? 'Now' : 'Today'}
                    </Button>
                    {!required && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')} disabled={!selected}>
                            Clear
                        </Button>
                    )}
                </div>
                <Button type="button" size="sm" onClick={() => close()}>
                    Done
                </Button>
            </div>
        </div>
    );
}
