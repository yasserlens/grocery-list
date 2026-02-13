import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireListFromToken, requireListNote } from '$lib/server/api';
import { deleteItem, getItemsForNote, updateItem } from '$lib/server/store';

function ensureItemInNote(noteId: string, itemId: string) {
  const item = getItemsForNote(noteId).find((candidate) => candidate.id === itemId);
  if (!item) throw error(404, 'Item not found.');
  return item;
}

export const PATCH: RequestHandler = async ({ params, request }) => {
  const list = requireListFromToken(params.token);
  const note = requireListNote(list.id, params.noteId);
  const item = ensureItemInNote(note.id, params.itemId);
  const payload = (await request.json().catch(() => ({}))) as { rawText?: string };
  const rawText = payload.rawText?.trim();
  if (!rawText) return json({ error: 'rawText is required.' }, { status: 400 });
  const updated = updateItem(item.id, rawText);
  return json({ item: updated });
};

export const DELETE: RequestHandler = async ({ params }) => {
  const list = requireListFromToken(params.token);
  const note = requireListNote(list.id, params.noteId);
  const item = ensureItemInNote(note.id, params.itemId);
  deleteItem(item.id);
  return json({ ok: true });
};
