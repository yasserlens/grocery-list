import assignments from '../../../data/starter-item-assignments.v1.json';
import { normalizeItem } from './normalize-item';
import { CATEGORY_EMOJI, isGroceryCategory, type GroceryCategory } from './taxonomy';

export type ItemSource = 'seed' | 'correction' | 'fallback';

export type ListRecord = {
  id: string;
  title: string;
  shareToken: string;
  createdAt: string;
  updatedAt: string;
};

export type NoteRecord = {
  id: string;
  listId: string;
  title: string;
  body: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ItemRecord = {
  id: string;
  noteId: string;
  rawText: string;
  normalizedText: string;
  quantity: string | null;
  category: GroceryCategory;
  emoji: string;
  source: ItemSource;
  confidence: number;
  createdAt: string;
  updatedAt: string;
};

type Assignment = { category: GroceryCategory; emoji: string; confidence: number; source: ItemSource };

const lists = new Map<string, ListRecord>();
const listByToken = new Map<string, string>();
const notes = new Map<string, NoteRecord>();
const items = new Map<string, ItemRecord>();
const assignmentCache = new Map<string, Assignment>();

for (const [normalizedText, entry] of Object.entries(assignments)) {
  if (!isGroceryCategory(entry.category)) continue;
  assignmentCache.set(normalizedText, {
    category: entry.category,
    emoji: entry.emoji,
    confidence: 0.95,
    source: 'seed'
  });
}

const nowIso = () => new Date().toISOString();
const id = () => crypto.randomUUID();
const token = () => `${crypto.randomUUID().replaceAll('-', '')}${crypto.randomUUID().replaceAll('-', '')}`;

export function createList(title: string) {
  const created: ListRecord = {
    id: id(),
    title: title.trim() || 'Untitled list',
    shareToken: token(),
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  lists.set(created.id, created);
  listByToken.set(created.shareToken, created.id);

  const starterNote: NoteRecord = {
    id: id(),
    listId: created.id,
    title: 'Groceries',
    body: null,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  notes.set(starterNote.id, starterNote);
  return { list: created, starterNote };
}

export function getListByToken(shareToken: string) {
  const listId = listByToken.get(shareToken);
  if (!listId) return null;
  return lists.get(listId) ?? null;
}

export function updateListTitle(listId: string, title: string) {
  const current = lists.get(listId);
  if (!current) return null;
  const next = { ...current, title: title.trim() || current.title, updatedAt: nowIso() };
  lists.set(listId, next);
  return next;
}

export function getNotesForList(listId: string) {
  return [...notes.values()].filter((note) => note.listId === listId);
}

export function createNote(listId: string, title: string, body?: string | null) {
  const note: NoteRecord = {
    id: id(),
    listId,
    title: title.trim() || 'Untitled note',
    body: body ?? null,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  notes.set(note.id, note);
  return note;
}

export function getNote(noteId: string) {
  return notes.get(noteId) ?? null;
}

export function updateNote(noteId: string, patch: { title?: string; body?: string | null }) {
  const current = notes.get(noteId);
  if (!current) return null;
  const next = {
    ...current,
    title: patch.title?.trim() || current.title,
    body: patch.body === undefined ? current.body : patch.body,
    updatedAt: nowIso()
  };
  notes.set(noteId, next);
  return next;
}

export function deleteNote(noteId: string) {
  notes.delete(noteId);
  for (const [itemId, item] of items.entries()) {
    if (item.noteId === noteId) items.delete(itemId);
  }
}

export function getItemsForNote(noteId: string) {
  return [...items.values()].filter((item) => item.noteId === noteId);
}

export function createItem(noteId: string, rawText: string) {
  const analyzed = analyzeRawText(rawText);
  const item: ItemRecord = {
    id: id(),
    noteId,
    rawText,
    normalizedText: analyzed.normalizedText,
    quantity: analyzed.quantity,
    category: analyzed.category,
    emoji: analyzed.emoji,
    source: analyzed.source,
    confidence: analyzed.confidence,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  items.set(item.id, item);
  return item;
}

export function updateItem(itemId: string, rawText: string) {
  const current = items.get(itemId);
  if (!current) return null;
  const analyzed = analyzeRawText(rawText);
  const next = {
    ...current,
    rawText,
    normalizedText: analyzed.normalizedText,
    quantity: analyzed.quantity,
    category: analyzed.category,
    emoji: analyzed.emoji,
    source: analyzed.source,
    confidence: analyzed.confidence,
    updatedAt: nowIso()
  };
  items.set(itemId, next);
  return next;
}

export function deleteItem(itemId: string) {
  items.delete(itemId);
}

export function analyzeRawText(rawText: string) {
  const normalized = normalizeItem(rawText);
  const cached = assignmentCache.get(normalized.normalizedText);
  if (cached) {
    return {
      ...normalized,
      category: cached.category,
      emoji: cached.emoji,
      source: cached.source,
      confidence: cached.confidence
    };
  }

  return {
    ...normalized,
    category: 'other' as GroceryCategory,
    emoji: CATEGORY_EMOJI.other,
    source: 'fallback' as ItemSource,
    confidence: 0.3
  };
}

export function analyzeBatch(rawItems: string[]) {
  return rawItems.map((rawText) => analyzeRawText(rawText));
}

export function correctItem(itemId: string, category: GroceryCategory, emoji: string) {
  const item = items.get(itemId);
  if (!item) return null;
  const corrected = {
    ...item,
    category,
    emoji,
    source: 'correction' as ItemSource,
    confidence: 1,
    updatedAt: nowIso()
  };
  items.set(itemId, corrected);
  assignmentCache.set(item.normalizedText, {
    category,
    emoji,
    confidence: 1,
    source: 'correction'
  });
  return corrected;
}
