import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireListFromToken, requireListNote } from '$lib/server/api';
import { createItem, getItemsForNote } from '$lib/server/store';

export const GET: RequestHandler = async ({ params }) => {
  const list = requireListFromToken(params.token);
  const note = requireListNote(list.id, params.noteId);
  return json({ items: getItemsForNote(note.id) });
};

export const POST: RequestHandler = async ({ params, request }) => {
  const list = requireListFromToken(params.token);
  const note = requireListNote(list.id, params.noteId);
  const payload = (await request.json().catch(() => ({}))) as { rawText?: string };
  const rawText = payload.rawText?.trim();
  if (!rawText) {
    return json({ error: 'rawText is required.' }, { status: 400 });
  }
  const item = createItem(note.id, rawText);
  return json({ item });
};
