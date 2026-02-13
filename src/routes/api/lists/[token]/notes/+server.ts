import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireListFromToken } from '$lib/server/api';
import { createNote, getNotesForList } from '$lib/server/store';

export const GET: RequestHandler = async ({ params }) => {
  const list = requireListFromToken(params.token);
  return json({ notes: getNotesForList(list.id) });
};

export const POST: RequestHandler = async ({ params, request }) => {
  const list = requireListFromToken(params.token);
  const payload = (await request.json().catch(() => ({}))) as { title?: string; body?: string };
  const note = createNote(list.id, payload.title ?? '', payload.body ?? null);
  return json({ note });
};
