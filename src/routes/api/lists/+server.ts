import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createList } from '$lib/server/store';

export const POST: RequestHandler = async ({ request, url }) => {
  const payload = (await request.json().catch(() => ({}))) as { title?: string };
  const { list, starterNote } = createList(payload.title ?? '');

  return json({
    list,
    starterNote,
    shareUrl: `${url.origin}/l/${list.shareToken}`
  });
};
