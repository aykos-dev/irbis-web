import { cn } from "@/shared/lib/cn";

export type LinePoint = { label: string; value: number };

type LineChartProps = {
  points: readonly LinePoint[];
  /** Accessible name of the graphic (what it shows). */
  ariaLabel: string;
  /** Column headers of the screen-reader table fallback. */
  labelHeader: string;
  valueHeader: string;
  /** Visible axis captions: first and last point. */
  startLabel: string;
  endLabel: string;
  formatValue?: (value: number) => string;
  className?: string;
  testId?: string;
};

const WIDTH = 1000;
const HEIGHT = 224;
const BASELINE = 200;
const TOP = 16;

/**
 * Token-styled line chart as inline SVG (no chart library — standards defer that to the first
 * real report). The graphic is `role="img"` with a name; the same data follows as an
 * `sr-only` table so screen-reader users get every value, not just the shape.
 */
export function LineChart({
  points,
  ariaLabel,
  labelHeader,
  valueHeader,
  startLabel,
  endLabel,
  formatValue = String,
  className,
  testId,
}: LineChartProps) {
  const max = Math.max(1, ...points.map((point) => point.value));
  const stepX = points.length > 1 ? WIDTH / (points.length - 1) : 0;
  const coordinates = points.map((point, index) => {
    const x = Math.round(index * stepX * 10) / 10;
    const y = Math.round((BASELINE - (point.value / max) * (BASELINE - TOP)) * 10) / 10;
    return `${x},${y}`;
  });

  return (
    <figure data-testid={testId} className={cn("m-0 flex flex-col", className)}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={ariaLabel} className="h-60 w-full">
        <line x1="0" y1={BASELINE} x2={WIDTH} y2={BASELINE} strokeWidth="2" className="stroke-line" />
        <line x1="0" y1={(BASELINE + TOP) / 2} x2={WIDTH} y2={(BASELINE + TOP) / 2} strokeWidth="2" className="stroke-soft" />
        <polyline
          points={coordinates.join(" ")}
          fill="none"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
          className="stroke-teal-700"
        />
        <text x="0" y={HEIGHT - 4} className="fill-muted text-small">
          {startLabel}
        </text>
        <text x={WIDTH} y={HEIGHT - 4} textAnchor="end" className="fill-muted text-small">
          {endLabel}
        </text>
      </svg>
      <table className="sr-only">
        <caption>{ariaLabel}</caption>
        <thead>
          <tr>
            <th scope="col">{labelHeader}</th>
            <th scope="col">{valueHeader}</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.label}>
              <th scope="row">{point.label}</th>
              <td>{formatValue(point.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
