import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireListFromToken, requireListNote } from '$lib/server/api';
import { deleteNote, getItemsForNote, updateNote } from '$lib/server/store';

export const GET: RequestHandler = async ({ params }) => {
  const list = requireListFromToken(params.token);
  const note = requireListNote(list.id, params.noteId);
  return json({ note, items: getItemsForNote(note.id) });
};

export const PATCH: RequestHandler = async ({ params, request }) => {
  const list = requireListFromToken(params.token);
  const note = requireListNote(list.id, params.noteId);
  const payload = (await request.json().catch(() => ({}))) as { title?: string; body?: string | null };
  const updated = updateNote(note.id, payload);
  return json({ note: updated });
};

export const DELETE: RequestHandler = async ({ params }) => {
  const list = requireListFromToken(params.token);
  const note = requireListNote(list.id, params.noteId);
  deleteNote(note.id);
  return json({ ok: true });
};
