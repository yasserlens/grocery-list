import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireListFromToken } from '$lib/server/api';
import { analyzeBatch } from '$lib/server/store';

export const POST: RequestHandler = async ({ params, request }) => {
  requireListFromToken(params.token);
  const payload = (await request.json().catch(() => ({}))) as { items?: string[] };
  const items = (payload.items ?? []).map((entry) => entry.trim()).filter(Boolean);

  if (items.length === 0) {
    return json({ error: 'items[] is required.' }, { status: 400 });
  }

  if (items.length > 100) {
    return json({ error: 'Maximum 100 items per batch.' }, { status: 400 });
  }

  return json({ results: analyzeBatch(items) });
};
