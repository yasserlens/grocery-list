import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireListFromToken } from '$lib/server/api';
import { getNotesForList, updateListTitle } from '$lib/server/store';

export const GET: RequestHandler = async ({ params }) => {
  const list = requireListFromToken(params.token);
  const notes = getNotesForList(list.id);

  return json({
    list,
    notes
  });
};

export const PATCH: RequestHandler = async ({ params, request }) => {
  const list = requireListFromToken(params.token);
  const payload = (await request.json().catch(() => ({}))) as { title?: string };
  const updated = updateListTitle(list.id, payload.title ?? list.title);

  return json({ list: updated });
};
