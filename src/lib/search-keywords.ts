/**
 * Ported from Web `Apartment01/src/lib/utils.ts` (search keyword helpers only).
 * Keep in sync — used for feed text search + writing `searchKeywords` on save.
 */

const SEARCH_KEYWORD_MAX_GRAM = 5;

export function removeVietnameseTones(str: string) {
  if (!str) return '';
  let out = str.toLowerCase();
  out = out.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  out = out.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  out = out.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  out = out.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  out = out.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  out = out.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  out = out.replace(/đ/g, 'd');
  out = out.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  out = out.replace(/\u02C6|\u0306|\u031B/g, '');
  return out;
}

export function tokenizeSearchKeywords(text: string): string[] {
  if (!text) return [];

  const normalized = removeVietnameseTones(text)
    .replace(/[\/,\-_?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized.split(' ').filter(Boolean);
}

function withWordInitialDStroke(phrase: string): string {
  return phrase.replace(/\bd/g, 'đ');
}

export function searchKeywordIndexValues(phrase: string): string[] {
  const folded = phrase.replace(/đ/g, 'd');
  return [...new Set([folded, withWordInitialDStroke(folded)])];
}

export function generateSearchKeywords(text: string): string[] {
  const words = tokenizeSearchKeywords(text);
  const keywords = new Set<string>();

  words.forEach((word) => keywords.add(word));

  for (let i = 0; i < words.length; i++) {
    let combined = '';
    for (let j = i; j < Math.min(i + SEARCH_KEYWORD_MAX_GRAM, words.length); j++) {
      combined = combined ? `${combined} ${words[j]}` : words[j];
      keywords.add(combined);
    }
  }

  for (const keyword of [...keywords]) {
    const dotted = withWordInitialDStroke(keyword);
    if (dotted !== keyword) keywords.add(dotted);
  }

  return Array.from(keywords);
}

export type ApartmentTextSearchPlan = {
  tokens: string[];
  firestoreValue: string;
  firestoreValues: string[];
};

/** AND mọi từ khóa của bất kỳ câu query nào. */
export function planApartmentTextSearch(
  query: string,
): ApartmentTextSearchPlan | null {
  const tokens: string[] = [];
  const seen = new Set<string>();

  for (const token of tokenizeSearchKeywords(query)) {
    if (seen.has(token)) continue;
    seen.add(token);
    tokens.push(token);
  }

  if (tokens.length === 0) return null;

  const firestoreValue = tokens.slice(0, SEARCH_KEYWORD_MAX_GRAM).join(' ');
  return {
    tokens,
    firestoreValue,
    firestoreValues: searchKeywordIndexValues(firestoreValue),
  };
}

type SearchableApartment = {
  title?: string | null;
  address?: string | null;
  sourceCode?: string | null;
  landlordPhoneNumber?: string | null;
  searchKeywords?: string[] | null;
};

export function matchesAllSearchTokens(
  apt: SearchableApartment,
  tokens: string[],
  extraFields: Array<string | null | undefined> = [],
): boolean {
  if (tokens.length === 0) return true;

  const indexed = new Set(
    (apt.searchKeywords ?? []).map((keyword) => keyword.replace(/đ/g, 'd')),
  );
  const textTokens = new Set(
    tokenizeSearchKeywords(
      [
        apt.title,
        apt.address,
        apt.sourceCode,
        apt.landlordPhoneNumber,
        ...extraFields,
      ]
        .filter(Boolean)
        .join(' '),
    ),
  );

  return tokens.every((token) => indexed.has(token) || textTokens.has(token));
}

export function normalizeSearchText(text: string): string {
  return removeVietnameseTones(text || '')
    .replace(/[\/,\-_?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchesApartmentSearch(
  apt: SearchableApartment,
  searchQuery: string,
  extraFields: Array<string | null | undefined> = [],
): boolean {
  const plan = planApartmentTextSearch(searchQuery);
  if (!plan) return true;
  return matchesAllSearchTokens(apt, plan.tokens, extraFields);
}
