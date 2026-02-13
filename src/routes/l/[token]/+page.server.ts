import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { requireListFromToken } from '$lib/server/api';
import { getNotesForList, getItemsForNote } from '$lib/server/store';

export const load: PageServerLoad = async ({ params, url }) => {
  const list = requireListFromToken(params.token);
  const notes = getNotesForList(list.id);
  const selected = notes[0] ?? null;

  return {
    shareUrl: `${url.origin}/l/${list.shareToken}`,
    list,
    notes,
    selectedNoteId: selected?.id ?? null,
    items: selected ? getItemsForNote(selected.id) : []
  };
};
