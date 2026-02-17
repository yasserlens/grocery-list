const LEADING_MARKER_RE = /^([\-•*]|\[[ xX]?\])\s*/;
const PUNCT_RE = /[(){}\[\],.!?:;"'`~@#$%^&*_+=<>\\/|]/g;
const SPACE_RE = /\s+/g;
const PREFIX_QTY_RE = /^(\d+(?:[.,]\d+)?\s?(?:x|×|kg|g|lb|oz|l|ml))\s+/i;
const SUFFIX_QTY_RE = /\s+(\d+(?:[.,]\d+)?\s?(?:x|×|kg|g|lb|oz|l|ml))$/i;
const STRIP_LEADING_QTY_RE = /^(?:\d+(?:\.\d+)?\s*(?:x|×)?\s*)?(?:\d+\s*(?:g|kg|ml|l|oz|lb|lbs)\s*)?/i;

const IRREGULAR: Record<string, string> = {
  tomatoes: 'tomato',
  potatoes: 'potato',
  onions: 'onion',
  garlics: 'garlic',
  eggs: 'egg',
  berries: 'berry',
  cherries: 'cherry',
  loaves: 'loaf',
  leaves: 'leaf',
  knives: 'knife',
  wives: 'wife',
  children: 'child',
  feet: 'foot',
  teeth: 'tooth',
  mice: 'mouse'
};

export type NormalizedItem = {
  rawText: string;
  normalizedText: string;
  quantity: string | null;
};

function singularize(word: string): string {
  if (IRREGULAR[word]) return IRREGULAR[word];
  if (word.length <= 3) return word;

  if (word.endsWith('ies') && word.length > 4) {
    return `${word.slice(0, -3)}y`;
  }

  if (word.endsWith('ves') && word.length > 4) {
    return `${word.slice(0, -3)}f`;
  }

  if (/(xes|ses|zes|ches|shes)$/.test(word)) {
    return word.replace(/(xes|ses|zes|ches|shes)$/, (m) => m.slice(0, -2));
  }

  if (word.endsWith('s') && !word.endsWith('ss')) {
    return word.slice(0, -1);
  }

  return word;
}

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
  text = text.replace(STRIP_LEADING_QTY_RE, '').trim();

  if (text.length > 0) {
    text = text
      .split(' ')
      .map(singularize)
      .join(' ');
  }

  return {
    rawText,
    normalizedText: text,
    quantity
  };
}
