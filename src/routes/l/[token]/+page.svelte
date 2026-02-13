<script lang="ts">
  export let data: {
    list: { id: string; title: string; shareToken: string };
    notes: Array<{ id: string; title: string }>;
    items: Array<{ id: string; rawText: string; emoji: string; category: string }>;
    selectedNoteId: string | null;
    shareUrl: string;
  };

  let newItem = '';
  let newNote = '';
  let creating = false;

  async function createNote() {
    if (!newNote.trim()) return;
    await fetch(`/api/lists/${data.list.shareToken}/notes`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: newNote })
    });
    location.reload();
  }

  async function addItem() {
    if (!data.selectedNoteId || !newItem.trim() || creating) return;
    creating = true;
    await fetch(`/api/lists/${data.list.shareToken}/notes/${data.selectedNoteId}/items`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ rawText: newItem })
    });
    newItem = '';
    creating = false;
    location.reload();
  }
</script>

<main class="mx-auto max-w-4xl p-6">
  <header class="flex items-start justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">{data.list.title}</h1>
      <p class="mt-1 text-sm text-slate-600">Share link: <a class="text-blue-600 underline" href={data.shareUrl}>{data.shareUrl}</a></p>
    </div>
  </header>

  <div class="mt-6 grid gap-4 md:grid-cols-[280px_1fr]">
    <aside class="rounded-lg border border-slate-200 bg-white p-4">
      <h2 class="text-sm font-semibold text-slate-900">Notes</h2>
      <ul class="mt-3 space-y-2 text-sm text-slate-700">
        {#each data.notes as note}
          <li class="rounded bg-slate-50 px-2 py-1">{note.title}</li>
        {/each}
      </ul>
      <div class="mt-4">
        <input bind:value={newNote} class="w-full rounded border border-slate-300 px-2 py-1" placeholder="New note" />
        <button class="mt-2 w-full rounded bg-slate-900 px-3 py-1.5 text-white" on:click={createNote}>Add note</button>
      </div>
    </aside>

    <section class="rounded-lg border border-slate-200 bg-white p-4">
      <h2 class="text-sm font-semibold text-slate-900">Items</h2>
      <ul class="mt-3 space-y-2">
        {#each data.items as item}
          <li class="flex items-center justify-between rounded bg-slate-50 px-3 py-2 text-sm">
            <span>{item.rawText}</span>
            <span class="text-slate-600">{item.emoji} {item.category}</span>
          </li>
        {/each}
      </ul>

      <div class="mt-4 flex gap-2">
        <input bind:value={newItem} class="flex-1 rounded border border-slate-300 px-3 py-2" placeholder="Add item" />
        <button class="rounded bg-slate-900 px-4 py-2 text-white" on:click={addItem} disabled={creating}>Add</button>
      </div>
    </section>
  </div>
</main>
