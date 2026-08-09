/** Ported from Web: Apartment01/src/lib/price-range.ts */

export const PRICE_FILTER_MIN = 0;
export const PRICE_FILTER_MAX = 50;

type PriceRangeParts = {
  min: number;
  max: number | null;
};

const normalizePriceValue = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Number(value.toFixed(1)));
};

export const parsePriceRange = (priceRange?: string): PriceRangeParts => {
  if (!priceRange || priceRange === 'all') {
    return { min: PRICE_FILTER_MIN, max: null };
  }

  const [rawMin = '', rawMax = ''] = priceRange.split('-');
  const parsedMin = rawMin === '' ? PRICE_FILTER_MIN : Number(rawMin);
  const parsedMax = rawMax === '' ? null : Number(rawMax);

  const min = normalizePriceValue(parsedMin);
  const max =
    parsedMax === null || Number.isNaN(parsedMax)
      ? null
      : normalizePriceValue(parsedMax);

  if (max !== null && min > max) {
    return { min: max, max: min };
  }

  return { min, max };
};

export const isPriceInRange = (
  apartmentPrice: number,
  range: PriceRangeParts,
) => {
  const price = normalizePriceValue(apartmentPrice);
  const meetsMin = price >= range.min;
  const meetsMax = range.max === null ? true : price <= range.max;
  return meetsMin && meetsMax;
};

/**
 * Build `min-max` priceRange string (triệu VND) used by Firestore client filter.
 * Empty max → open-ended (`"20-"`).
 */
export const buildPriceRangeValue = (
  minInput: string,
  maxInput: string,
): string | null => {
  const minRaw = minInput.trim().replace(',', '.');
  const maxRaw = maxInput.trim().replace(',', '.');

  if (!minRaw && !maxRaw) return null;

  const min =
    minRaw === '' ? PRICE_FILTER_MIN : Number(minRaw);
  const max = maxRaw === '' ? null : Number(maxRaw);

  if (Number.isNaN(min) || (max !== null && Number.isNaN(max))) {
    return null;
  }
  if (min < 0 || (max !== null && max < 0)) {
    return null;
  }

  const normalized = parsePriceRange(
    max === null ? `${min}-` : `${min}-${max}`,
  );

  if (normalized.max === null) {
    return `${normalized.min}-`;
  }
  return `${normalized.min}-${normalized.max}`;
};
