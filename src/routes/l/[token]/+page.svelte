<script lang="ts">
  export let data: {
    list: { id: string; title: string; shareToken: string };
    notes: Array<{ id: string; title: string }>;
    items: Array<{ id: string; rawText: string; emoji: string; category: string }>;
    selectedNoteId: string | null;
    shareUrl: string;
  };

  type GroceryItem = { id: string; rawText: string; emoji: string; category: string };
  type ItemGroup = { category: string; items: GroceryItem[] };

  let newItem = '';
  let newNote = '';
  let creating = false;
  let deletingItemIds = new Set<string>();

  let groupedItems = groupByCategory(data.items);
  let draggedGroupCategory: string | null = null;
  let draggedItemSource: { category: string; index: number } | null = null;

  function groupByCategory(items: GroceryItem[]): ItemGroup[] {
    const groupMap = new Map<string, GroceryItem[]>();

    for (const item of items) {
      const category = item.category || 'uncategorized';
      const existing = groupMap.get(category);
      if (existing) {
        existing.push(item);
      } else {
        groupMap.set(category, [item]);
      }
    }

    return [...groupMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([category, grouped]) => ({ category, items: grouped }));
  }

  function insertItemIntoGroups(item: GroceryItem) {
    const groupIndex = groupedItems.findIndex((group) => group.category === item.category);

    if (groupIndex >= 0) {
      const next = groupedItems.map((group, index) =>
        index === groupIndex ? { ...group, items: [...group.items, item] } : group
      );
      groupedItems = next;
      return;
    }

    groupedItems = [...groupedItems, { category: item.category, items: [item] }].sort((a, b) =>
      a.category.localeCompare(b.category)
    );
  }

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
    const res = await fetch(`/api/lists/${data.list.shareToken}/notes/${data.selectedNoteId}/items`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ rawText: newItem })
    });

    if (res.ok) {
      const payload = (await res.json()) as {
        item: GroceryItem;
      };
      insertItemIntoGroups(payload.item);
      newItem = '';
    }

    creating = false;
  }

  async function deleteListItem(itemId: string) {
    if (!data.selectedNoteId || deletingItemIds.has(itemId)) return;

    deletingItemIds = new Set(deletingItemIds).add(itemId);
    const res = await fetch(`/api/lists/${data.list.shareToken}/notes/${data.selectedNoteId}/items/${itemId}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      groupedItems = groupedItems
        .map((group) => ({ ...group, items: group.items.filter((item) => item.id !== itemId) }))
        .filter((group) => group.items.length > 0);
    }

    const next = new Set(deletingItemIds);
    next.delete(itemId);
    deletingItemIds = next;
  }

  function handleNewItemKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    void addItem();
  }

  function handleGroupDragStart(category: string) {
    draggedGroupCategory = category;
  }

  function handleGroupDrop(targetCategory: string) {
    if (!draggedGroupCategory || draggedGroupCategory === targetCategory) return;

    const sourceIndex = groupedItems.findIndex((group) => group.category === draggedGroupCategory);
    const targetIndex = groupedItems.findIndex((group) => group.category === targetCategory);

    if (sourceIndex < 0 || targetIndex < 0) return;

    const next = [...groupedItems];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    groupedItems = next;
    draggedGroupCategory = null;
  }

  function handleItemDragStart(category: string, index: number) {
    draggedItemSource = { category, index };
  }

  function handleItemDrop(targetCategory: string, targetIndex: number) {
    if (!draggedItemSource) return;

    const sourceGroupIndex = groupedItems.findIndex((group) => group.category === draggedItemSource?.category);
    const targetGroupIndex = groupedItems.findIndex((group) => group.category === targetCategory);
    if (sourceGroupIndex < 0 || targetGroupIndex < 0) return;

    const sourceGroup = groupedItems[sourceGroupIndex];
    const item = sourceGroup.items[draggedItemSource.index];
    if (!item) return;

    const next = groupedItems.map((group) => ({ ...group, items: [...group.items] }));
    next[sourceGroupIndex].items.splice(draggedItemSource.index, 1);

    const adjustedTargetIndex =
      sourceGroupIndex === targetGroupIndex && draggedItemSource.index < targetIndex ? targetIndex - 1 : targetIndex;

    next[targetGroupIndex].items.splice(adjustedTargetIndex, 0, { ...item, category: targetCategory });
    groupedItems = next.filter((group) => group.items.length > 0);
    draggedItemSource = null;
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
      <div class="mt-3 space-y-3">
        {#each groupedItems as group (group.category)}
          <section
            class="rounded border border-slate-200 bg-slate-50 p-2"
            role="listitem"
            draggable="true"
            on:dragstart={() => handleGroupDragStart(group.category)}
            on:dragover={(event) => event.preventDefault()}
            on:drop={() => handleGroupDrop(group.category)}
          >
            <header class="mb-2 cursor-grab px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {group.category}
            </header>
            <ul class="space-y-2">
              {#each group.items as item, itemIndex (item.id)}
                <li
                  role="listitem"
                  draggable="true"
                  on:dragstart={() => handleItemDragStart(group.category, itemIndex)}
                  on:dragover={(event) => event.preventDefault()}
                  on:drop={() => handleItemDrop(group.category, itemIndex)}
                  class="flex items-center justify-between rounded bg-white px-3 py-2 text-sm"
                >
                  <span>{item.rawText}</span>
                  <div class="flex items-center gap-3">
                    <span class="text-slate-600">{item.emoji} {item.category}</span>
                    <button
                      class="rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                      on:click={() => deleteListItem(item.id)}
                      disabled={deletingItemIds.has(item.id)}
                      aria-label={`Delete ${item.rawText}`}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              {/each}
              <li
                role="listitem"
                class="rounded border border-dashed border-slate-300 px-3 py-2 text-center text-xs text-slate-500"
                on:dragover={(event) => event.preventDefault()}
                on:drop={() => handleItemDrop(group.category, group.items.length)}
              >
                Drop here to move item to end of {group.category}
              </li>
            </ul>
          </section>
        {/each}
      </div>

      <div class="mt-4 flex gap-2">
        <input
          bind:value={newItem}
          on:keydown={handleNewItemKeydown}
          class="flex-1 rounded border border-slate-300 px-3 py-2"
          placeholder="Add item"
        />
        <button class="rounded bg-slate-900 px-4 py-2 text-white" on:click={addItem} disabled={creating}>Add</button>
      </div>
    </section>
  </div>
</main>
