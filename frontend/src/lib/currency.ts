// Single source of truth for price display.
// Prices are stored in USD; we show them in UZS at a fixed rate.
// Override via NEXT_PUBLIC_USD_TO_UZS without code changes.
export const USD_TO_UZS = Number(process.env.NEXT_PUBLIC_USD_TO_UZS) || 13000;

export function formatUZS(usd: number): string {
  const sum = Math.round((usd || 0) * USD_TO_UZS);
  return sum.toLocaleString("uz-UZ") + " UZS";
}
