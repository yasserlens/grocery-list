import { error } from '@sveltejs/kit';
import { getListByToken, getNote } from './store';

export function requireListFromToken(token: string | undefined) {
  const shareToken = token?.trim();
  if (!shareToken || shareToken.length < 24) {
    throw error(400, 'Invalid share token.');
  }

  const list = getListByToken(shareToken);
  if (!list) {
    throw error(404, 'List not found.');
  }

  return list;
}

export function requireListNote(listId: string, noteId: string | undefined) {
  if (!noteId) throw error(400, 'Note id is required.');
  const note = getNote(noteId);
  if (!note || note.listId !== listId) {
    throw error(404, 'Note not found.');
  }
  return note;
}
