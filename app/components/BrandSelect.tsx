'use client';

import { useEffect, useState } from 'react';

export default function BrandSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [brands, setBrands] = useState<string[]>([]);
  const [other, setOther] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    fetch('/api/brands', { cache: 'no-store' }).then(async response => {
      if (!response.ok) throw new Error('Unable to load brands');
      return response.json();
    }).then(({ brands, success }) => {
        if (!active) return;
        setBrands(Array.from(new Set(((success ? brands : []) || []).map((brand: { name: string }) => brand.name.trim()).filter((name: string) => name && name.toLowerCase() !== 'other'))));
        setFailed(!success);
        setLoading(false);
      }, () => { if (active) { setFailed(true); setLoading(false); } });
    return () => { active = false; };
  }, []);
  const matched = brands.find(brand => brand.toLowerCase() === value.trim().toLowerCase());
  const custom = other || Boolean(value && !matched);
  const inputClass = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-primary';
  return <div className="space-y-2">
    <select aria-label="Brand" required disabled={loading} value={custom ? '__other__' : matched || ''} className={inputClass}
      onChange={event => { setOther(event.target.value === '__other__'); onChange(event.target.value === '__other__' ? '' : event.target.value); }}>
      <option value="">{loading ? 'Loading brands...' : 'Select brand'}</option>
      {brands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
      <option value="__other__">Other</option>
    </select>
    {custom && <input aria-label="Your brand name" required maxLength={100} value={value} onChange={event => onChange(event.target.value)} placeholder="Enter your brand name" className={inputClass} />}
    {failed && <p className="text-xs text-slate-500">Brands could not be loaded. Choose Other to enter your brand.</p>}
  </div>;
}
