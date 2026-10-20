/** Tier colour as a swatch plus its hex. The colour is data, so it goes on the SVG fill, not a class. */
export function ColourChip({ colour }: { colour: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false" className="shrink-0">
        <circle cx="10" cy="10" r="9" fill={colour} className="stroke-line" strokeWidth="2" />
      </svg>
      <span className="text-small uppercase text-body">{colour}</span>
    </span>
  );
}
