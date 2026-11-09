/**
 * Dates come from Laravel serialised in the application's timezone
 * (e.g. "2026-11-05T18:00:00.000000Z"). We read the wall-clock part only so
 * the admin sees exactly what they typed, regardless of the browser timezone.
 */
export function parseWallClock(value: string | null | undefined): Date | null {
    if (!value) return null;
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
    if (!m) return null;
    return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
}

/** App-wide date style: "October 5, 2026" (en-US so it reads the same in every browser). */
const DATE_FORMAT: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
// hour12 forces "12:00 AM" instead of "0:00" even where the locale would default to a 24-hour clock.
const TIME_FORMAT: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };

/** A local Date in the app-wide style, e.g. "October 5, 2026". */
export function formatDateOf(d: Date): string {
    return d.toLocaleDateString('en-US', DATE_FORMAT);
}

/** "October 5, 2026 at 6:00 PM" */
export function formatDateTime(value: string | null | undefined): string {
    const d = parseWallClock(value);
    if (!d) return '—';
    return `${formatDateOf(d)} at ${d.toLocaleTimeString('en-US', TIME_FORMAT)}`;
}

/** "October 5, 2026" */
export function formatDate(value: string | null | undefined): string {
    const d = parseWallClock(value);
    if (!d) return '—';
    return formatDateOf(d);
}

/** "6:00 PM" */
export function formatTime(value: string | null | undefined): string {
    const d = parseWallClock(value);
    if (!d) return '';
    return d.toLocaleTimeString('en-US', TIME_FORMAT);
}

/**
 * Raw values (e.g. audit log details) may hold dates as "2026-10-05 18:00:00",
 * "2026-10-05T18:00:00.000000Z" or "2026-10-05". Return those in the app-wide style
 * ("October 5, 2026 at 6:00 PM" / "October 5, 2026") and anything else unchanged.
 */
export function formatIfDate<T>(value: T): T | string {
    if (typeof value !== 'string') return value;
    if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(value)) return formatDateTime(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return formatDate(`${value}T00:00`);
    return value;
}

/** Value for an <input type="datetime-local"> */
export function toInputDateTime(value: string | null | undefined): string {
    if (!value) return '';
    const m = value.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
    return m ? `${m[1]}T${m[2]}` : '';
}

export function formatRelative(value: string | null | undefined): string {
    const d = parseWallClock(value);
    if (!d) return '—';
    const diff = (d.getTime() - Date.now()) / 1000;
    const abs = Math.abs(diff);
    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
    if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
    if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
    if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), 'day');
    return formatDate(value);
}

export function percent(part: number, total: number): number {
    return total === 0 ? 0 : Math.round((part / total) * 100);
}

/** "₦1,500,000.00" (decimal strings from Laravel or numbers). */
export function formatMoney(value: string | number | null | undefined, decimals = 2): string {
    if (value === null || value === undefined || value === '') return '—';
    const n = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''));
    if (Number.isNaN(n)) return '—';
    return '₦' + n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** "₦1.5bn", "₦250m", "₦12.4k" for charts and KPI tiles. */
export function formatCompact(value: number, currency = true): string {
    const abs = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    const prefix = currency ? '₦' : '';
    if (abs >= 1e12) return `${sign}${prefix}${(abs / 1e12).toFixed(abs >= 1e13 ? 0 : 1)}tn`;
    if (abs >= 1e9) return `${sign}${prefix}${(abs / 1e9).toFixed(abs >= 1e10 ? 0 : 1)}bn`;
    if (abs >= 1e6) return `${sign}${prefix}${(abs / 1e6).toFixed(abs >= 1e7 ? 0 : 1)}m`;
    if (abs >= 1e3) return `${sign}${prefix}${(abs / 1e3).toFixed(abs >= 1e4 ? 0 : 1)}k`;
    return `${sign}${prefix}${abs.toFixed(0)}`;
}

export function formatNumber(value: string | number | null | undefined, decimals = 0): string {
    if (value === null || value === undefined || value === '') return '—';
    const n = Number(value);
    return Number.isNaN(n) ? '—' : n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** Rates and prices: "18.5000" -> "18.50%". */
export function formatRate(value: string | number | null | undefined, suffix = '%'): string {
    if (value === null || value === undefined || value === '') return '—';
    const n = Number(value);
    return Number.isNaN(n) ? '—' : `${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}${suffix}`;
}

export function toNumber(value: string | number | null | undefined): number {
    if (value === null || value === undefined || value === '') return 0;
    const n = Number(String(value).replace(/,/g, ''));
    return Number.isNaN(n) ? 0 : n;
}

/** Amount in words for the commitment form ("Five Hundred Thousand Naira Only"). */
export function amountInWords(value: string | number | null | undefined): string {
    const n = Math.floor(toNumber(value));
    if (n <= 0) return '';
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const chunk = (x: number): string => {
        const parts: string[] = [];
        if (x >= 100) {
            parts.push(`${ones[Math.floor(x / 100)]} Hundred`);
            x %= 100;
        }
        if (x >= 20) {
            parts.push(tens[Math.floor(x / 10)] + (x % 10 ? `-${ones[x % 10]}` : ''));
        } else if (x > 0) {
            parts.push(ones[x]);
        }
        return parts.join(' and ');
    };
    const scales = [
        [1e12, 'Trillion'],
        [1e9, 'Billion'],
        [1e6, 'Million'],
        [1e3, 'Thousand'],
    ] as const;
    const out: string[] = [];
    let rest = n;
    for (const [size, name] of scales) {
        if (rest >= size) {
            out.push(`${chunk(Math.floor(rest / size))} ${name}`);
            rest %= size;
        }
    }
    if (rest > 0) out.push(chunk(rest));
    return `${out.join(', ')} Naira Only`;
}

/** The picker's YYYY-MM-DDTHH:mm value built from a local Date (e.g. "now"). */
export function toPickerValue(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
