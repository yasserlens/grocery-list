import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireListFromToken } from '$lib/server/api';
import { correctItem, getNotesForList, getItemsForNote } from '$lib/server/store';
import { isGroceryCategory } from '$lib/server/taxonomy';

function findItemInList(listId: string, itemId: string) {
  const listItems = getNotesForList(listId).flatMap((note) => getItemsForNote(note.id));
  return listItems.find((item) => item.id === itemId) ?? null;
}

export const POST: RequestHandler = async ({ params, request }) => {
  const list = requireListFromToken(params.token);
  const item = findItemInList(list.id, params.itemId);

  if (!item) throw error(404, 'Item not found.');

  const payload = (await request.json().catch(() => ({}))) as { category?: string; emoji?: string };
  if (!payload.category || !isGroceryCategory(payload.category)) {
    return json({ error: 'Valid category is required.' }, { status: 400 });
  }
  if (!payload.emoji || payload.emoji.trim().length === 0) {
    return json({ error: 'emoji is required.' }, { status: 400 });
  }

  const corrected = correctItem(item.id, payload.category, payload.emoji.trim());
  return json({ item: corrected });
};
