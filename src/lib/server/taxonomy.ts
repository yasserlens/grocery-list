export const CATEGORIES = [
  'produce',
  'dairy',
  'meat',
  'seafood',
  'bakery',
  'grain',
  'pasta',
  'pantry',
  'canned',
  'snack',
  'frozen',
  'beverage',
  'breakfast',
  'deli',
  'condiment',
  'baking',
  'nut_seed',
  'household',
  'personal_care',
  'baby',
  'pet',
  'international',
  'alcohol',
  'other'
] as const;

export type GroceryCategory = (typeof CATEGORIES)[number];

export const CATEGORY_EMOJI: Record<GroceryCategory, string> = {
  produce: '🥬',
  dairy: '🥛',
  meat: '🥩',
  seafood: '🐟',
  bakery: '🍞',
  grain: '🌾',
  pasta: '🍝',
  pantry: '🥫',
  canned: '🥫',
  snack: '🍿',
  frozen: '🧊',
  beverage: '🥤',
  breakfast: '🥣',
  deli: '🥪',
  condiment: '🫙',
  baking: '🧁',
  nut_seed: '🥜',
  household: '🧻',
  personal_care: '🧴',
  baby: '🍼',
  pet: '🐾',
  international: '🍱',
  alcohol: '🍷',
  other: '🛒'
};

export function isGroceryCategory(value: string): value is GroceryCategory {
  return CATEGORIES.includes(value as GroceryCategory);
}
