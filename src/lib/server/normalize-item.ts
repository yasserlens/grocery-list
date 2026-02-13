const LEADING_MARKER_RE = /^([\-•*]|\[[ xX]?\])\s*/;
const PUNCT_RE = /[^\p{L}\p{N}\s]/gu;
const SPACE_RE = /\s+/g;
const PREFIX_QTY_RE = /^(\d+(?:[.,]\d+)?\s?(?:x|kg|g|lb|oz|l|ml))\s+/i;
const SUFFIX_QTY_RE = /\s+(\d+(?:[.,]\d+)?\s?(?:x|kg|g|lb|oz|l|ml))$/i;

const IRREGULAR_SINGULAR: Record<string, string> = {
  tomatoes: 'tomato',
  potatoes: 'potato',
  berries: 'berry',
  eggs: 'egg'
};

export type NormalizedItem = {
  rawText: string;
  normalizedText: string;
  quantity: string | null;
};

export function normalizeItem(rawText: string): NormalizedItem {
  const trimmed = rawText.trim();
  let text = trimmed.toLowerCase();
  text = text.replace(LEADING_MARKER_RE, '');

  let quantity: string | null = null;
  const prefixMatch = text.match(PREFIX_QTY_RE);
  if (prefixMatch) {
    quantity = prefixMatch[1];
    text = text.replace(PREFIX_QTY_RE, '');
  }

  const suffixMatch = text.match(SUFFIX_QTY_RE);
  if (!quantity && suffixMatch) {
    quantity = suffixMatch[1];
    text = text.replace(SUFFIX_QTY_RE, '');
  }

  text = text.replace(PUNCT_RE, ' ');
  text = text.replace(SPACE_RE, ' ').trim();

  if (IRREGULAR_SINGULAR[text]) {
    text = IRREGULAR_SINGULAR[text];
  } else if (text.endsWith('ies')) {
    text = `${text.slice(0, -3)}y`;
  } else if (text.endsWith('es') && text.length > 4) {
    text = text.slice(0, -2);
  } else if (text.endsWith('s') && text.length > 3) {
    text = text.slice(0, -1);
  }

  return {
    rawText,
    normalizedText: text,
    quantity
  };
}
