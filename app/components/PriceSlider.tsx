'use client';

export type PriceRange = [number, number | null];
export const PRICE_CEILING = 1000000;

export default function PriceSlider({ value, onChange, ceiling = PRICE_CEILING }: {
  value: PriceRange;
  onChange: (value: PriceRange) => void;
  ceiling?: number;
}) {
  const max = Math.max(ceiling, value[0], value[1] ?? 0, 1);
  const upper = value[1] ?? max;
  const thumb = 'pointer-events-none absolute inset-0 h-8 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#079bb5] [&::-webkit-slider-thumb]:cursor-grab [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[#079bb5] focus-visible:outline-2 focus-visible:outline-[#079bb5]';
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-xs font-semibold text-slate-600">Price range (PKR)</legend>
      <div className="flex justify-between gap-2 text-xs font-semibold text-[#079bb5]">
        <span>{value[0].toLocaleString()}</span><span>{value[1] === null ? `${max.toLocaleString()}+` : upper.toLocaleString()}</span>
      </div>
      <div className="relative my-2 h-8">
        <div className="absolute top-3.5 h-1 w-full rounded bg-slate-200" />
        <div className="absolute top-3.5 h-1 bg-[#079bb5]" style={{ left: `${value[0] / max * 100}%`, right: `${100 - upper / max * 100}%` }} />
        <input aria-label="Minimum price" type="range" min={0} max={max} step={1} value={value[0]} onChange={e => onChange([Math.min(Number(e.target.value), upper), value[1]])} className={thumb} style={{ zIndex: value[0] >= max / 2 ? 2 : 1 }} />
        <input aria-label="Maximum price" type="range" min={0} max={max} step={1} value={upper} onChange={e => { const n = Math.max(Number(e.target.value), value[0]); onChange([value[0], n === max ? null : n]); }} className={thumb} />
      </div>
      <div className="flex gap-2">
        <input aria-label="Minimum price amount" type="number" min={0} max={upper} value={value[0]} onChange={e => onChange([Math.max(0, Math.min(Number(e.target.value), upper)), value[1]])} className="w-1/2 rounded border border-slate-200 p-2 text-xs" />
        <input aria-label="Maximum price amount" type="number" min={value[0]} placeholder="Any maximum" value={value[1] ?? ''} onChange={e => onChange([value[0], e.target.value === '' ? null : Math.max(value[0], Number(e.target.value))])} className="w-1/2 rounded border border-slate-200 p-2 text-xs" />
      </div>
    </fieldset>
  );
}
