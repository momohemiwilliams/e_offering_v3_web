import { formatCompact } from '@/lib/format';
import { useState } from 'react';

/**
 * Small dependency-free SVG charts in the brand palette (navy, gold and tints).
 * Every chart also exposes its numbers in a hover title and an accessible label.
 */
export const PALETTE = ['#1d326d', '#c79d51', '#4f6db8', '#e3c87a', '#8fa3d6', '#7a5c22', '#2e4a99', '#a3a3a3'];

export function BarChart({
    data,
    height = 220,
    formatValue = formatCompact,
    labelSuffix = '',
    highlight,
}: {
    data: { label: string; value: number }[];
    height?: number;
    formatValue?: (n: number) => string;
    labelSuffix?: string;
    highlight?: string;
}) {
    const [hover, setHover] = useState<number | null>(null);
    if (data.length === 0) return <ChartEmpty />;
    const max = Math.max(...data.map((d) => d.value), 1);
    const width = Math.max(320, data.length * 56);
    const chartH = height - 40;
    const barW = Math.min(36, (width / data.length) * 0.6);

    return (
        <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: Math.min(width, 640) }} role="img" aria-label="Bar chart">
                {[0, 0.25, 0.5, 0.75, 1].map((t) => (
                    <g key={t}>
                        <line x1={0} x2={width} y1={10 + chartH * (1 - t)} y2={10 + chartH * (1 - t)} className="stroke-border" strokeDasharray="3 4" />
                        <text x={4} y={8 + chartH * (1 - t)} className="fill-muted-foreground text-[10px]">
                            {formatValue(max * t)}
                        </text>
                    </g>
                ))}
                {data.map((d, i) => {
                    const slot = width / data.length;
                    const h = (d.value / max) * chartH;
                    const x = slot * i + (slot - barW) / 2;
                    const isHl = highlight !== undefined && d.label === highlight;
                    return (
                        <g key={d.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                            <title>{`${d.label}${labelSuffix}: ${formatValue(d.value)}`}</title>
                            <rect x={x} y={10 + chartH - h} width={barW} height={Math.max(h, 1)} rx={4} fill={isHl ? PALETTE[1] : PALETTE[0]} opacity={hover === null || hover === i ? 1 : 0.55} />
                            <text x={slot * i + slot / 2} y={height - 12} textAnchor="middle" className="fill-muted-foreground text-[10px]">
                                {d.label}
                                {labelSuffix}
                            </text>
                            {hover === i && (
                                <text x={slot * i + slot / 2} y={4 + chartH - h} textAnchor="middle" className="fill-foreground text-[11px] font-semibold">
                                    {formatValue(d.value)}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

/** Demand curve: cumulative demand by bid rate, with the offer size as a reference line. */
export function LineChart({
    points,
    reference,
    referenceLabel = 'Offer size',
    marker,
    height = 240,
    xSuffix = '%',
}: {
    points: { x: number; y: number }[];
    reference?: number;
    referenceLabel?: string;
    marker?: number | null;
    height?: number;
    xSuffix?: string;
}) {
    if (points.length === 0) return <ChartEmpty />;
    const width = 640;
    const pad = { l: 56, r: 16, t: 14, b: 32 };
    const xs = points.map((p) => p.x);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...points.map((p) => p.y), reference ?? 0, 1) * 1.08;
    const sx = (x: number) => pad.l + (maxX === minX ? (width - pad.l - pad.r) / 2 : ((x - minX) / (maxX - minX)) * (width - pad.l - pad.r));
    const sy = (y: number) => pad.t + (1 - y / maxY) * (height - pad.t - pad.b);
    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.x)},${sy(p.y)}`).join(' ');
    const area = `${path} L${sx(points[points.length - 1].x)},${sy(0)} L${sx(points[0].x)},${sy(0)} Z`;

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Demand curve">
            {[0, 0.5, 1].map((t) => (
                <g key={t}>
                    <line x1={pad.l} x2={width - pad.r} y1={sy(maxY * t)} y2={sy(maxY * t)} className="stroke-border" strokeDasharray="3 4" />
                    <text x={pad.l - 6} y={sy(maxY * t) + 3} textAnchor="end" className="fill-muted-foreground text-[10px]">
                        {formatCompact(maxY * t)}
                    </text>
                </g>
            ))}
            <path d={area} fill={PALETTE[0]} opacity={0.08} />
            <path d={path} fill="none" stroke={PALETTE[0]} strokeWidth={2.5} strokeLinejoin="round" />
            {points.map((p) => (
                <circle key={p.x} cx={sx(p.x)} cy={sy(p.y)} r={3.5} fill={PALETTE[0]}>
                    <title>{`${p.x}${xSuffix}: ${formatCompact(p.y)} cumulative`}</title>
                </circle>
            ))}
            {reference !== undefined && (
                <g>
                    <line x1={pad.l} x2={width - pad.r} y1={sy(reference)} y2={sy(reference)} stroke={PALETTE[1]} strokeWidth={2} strokeDasharray="6 4" />
                    <text x={width - pad.r} y={sy(reference) - 5} textAnchor="end" className="text-[10px] font-medium" fill={PALETTE[5]}>
                        {referenceLabel} {formatCompact(reference)}
                    </text>
                </g>
            )}
            {marker !== undefined && marker !== null && (
                <line x1={sx(marker)} x2={sx(marker)} y1={pad.t} y2={sy(0)} stroke={PALETTE[1]} strokeWidth={1.5} />
            )}
            {points.map((p) => (
                <text key={`l${p.x}`} x={sx(p.x)} y={height - 10} textAnchor="middle" className="fill-muted-foreground text-[10px]">
                    {p.x}
                    {xSuffix}
                </text>
            ))}
        </svg>
    );
}

export function DonutChart({ data, size = 180, centerLabel }: { data: { label: string; value: number }[]; size?: number; centerLabel?: string }) {
    const total = data.reduce((s, d) => s + d.value, 0);
    if (total <= 0) return <ChartEmpty />;
    const r = size / 2 - 14;
    const c = 2 * Math.PI * r;
    let offset = 0;

    return (
        <div className="flex flex-wrap items-center gap-6">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Breakdown">
                <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
                    {data.map((d, i) => {
                        const len = (d.value / total) * c;
                        const el = (
                            <circle
                                key={d.label}
                                cx={size / 2}
                                cy={size / 2}
                                r={r}
                                fill="none"
                                stroke={PALETTE[i % PALETTE.length]}
                                strokeWidth={22}
                                strokeDasharray={`${len} ${c - len}`}
                                strokeDashoffset={-offset}
                            >
                                <title>{`${d.label}: ${formatCompact(d.value)} (${Math.round((d.value / total) * 100)}%)`}</title>
                            </circle>
                        );
                        offset += len;
                        return el;
                    })}
                </g>
                <text x="50%" y="48%" textAnchor="middle" className="fill-foreground text-[15px] font-semibold">
                    {formatCompact(total)}
                </text>
                <text x="50%" y="60%" textAnchor="middle" className="fill-muted-foreground text-[10px]">
                    {centerLabel ?? 'Total'}
                </text>
            </svg>
            <ul className="min-w-40 space-y-1.5 text-sm">
                {data.map((d, i) => (
                    <li key={d.label} className="flex items-center gap-2">
                        <span className="size-2.5 rounded-sm" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                        <span className="flex-1">{d.label}</span>
                        <span className="text-muted-foreground tabular-nums">{Math.round((d.value / total) * 100)}%</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/** Horizontal progress bar for subscription level (100% marker = offer size). */
export function SubscriptionMeter({ level }: { level: number }) {
    const pct = Math.min(level, 200);
    const tone = level >= 100 ? 'bg-emerald-500' : level >= 50 ? 'bg-gold' : 'bg-rose-500';
    return (
        <div>
            <div className="bg-muted relative h-3 overflow-hidden rounded-full">
                <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct / 2}%` }} />
                <span className="bg-navy absolute top-0 left-1/2 h-full w-0.5" title="100% of offer size" />
            </div>
            <div className="text-muted-foreground mt-1 flex justify-between text-[11px]">
                <span>0%</span>
                <span>100%</span>
                <span>200%+</span>
            </div>
        </div>
    );
}

function ChartEmpty() {
    return <div className="text-muted-foreground flex h-40 items-center justify-center text-sm">No data yet</div>;
}
