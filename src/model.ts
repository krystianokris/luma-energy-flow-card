export type Reading = { state: unknown; attributes?: Record<string, unknown> } | null | undefined;
export function numeric(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !value.trim()) return null;
  const n = Number(value); return Number.isFinite(n) ? n : null;
}
export function power(e: Reading): number | null {
  const n = numeric(e?.state); if (n === null) return null;
  const u = String(e?.attributes?.unit_of_measurement || '').toLowerCase();
  if (u === 'w') return n;
  if (u === 'kw') return n * 1000;
  return null;
}
export function energy(e: Reading): number | null {
  const n = numeric(e?.state); if (n === null) return null;
  const u = String(e?.attributes?.unit_of_measurement || '').toLowerCase();
  return u === 'kwh' ? n : u === 'wh' ? n / 1000 : null;
}
export function gbp(e: Reading, rate = false): number | null {
  const n = numeric(e?.state); if (n === null) return null;
  const u = String(e?.attributes?.unit_of_measurement || '').toLowerCase().replace(/\s/g, '');
  if (rate ? ['gbp/kwh','£/kwh'].includes(u) : ['gbp','£'].includes(u)) return n;
  if (rate ? ['p/kwh','pence/kwh','gbpence/kwh'].includes(u) : ['p','pence','gbpence'].includes(u)) return n / 100;
  return null;
}
export function signed(single: number | null, inward: number | null, outward: number | null, split: boolean, invert: boolean): number | null {
  if (split) return inward === null || outward === null ? null : Math.max(0, inward) - Math.max(0, outward);
  return single === null ? null : single * (invert ? -1 : 1);
}
export const watts = (n: number | null) => n === null ? '—' : Math.abs(n) >= 1000 ? `${(Math.abs(n)/1000).toFixed(2)} kW` : `${Math.round(Math.abs(n))} W`;
export const money = (n: number | null) => n === null ? '—' : new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(n);
