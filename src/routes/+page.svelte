<script lang="ts">
  let title = 'Weekly groceries';
  let creating = false;
  let error = '';

  async function createList() {
    creating = true;
    error = '';

    const res = await fetch('/api/lists', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title })
    });

    if (!res.ok) {
      error = 'Failed to create list.';
      creating = false;
      return;
    }

    const data = await res.json();
    window.location.href = `/l/${data.list.shareToken}`;
  }

  function handleTitleKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    void createList();
  }
</script>

<main class="mx-auto max-w-3xl p-8">
  <h1 class="text-3xl font-bold text-slate-900">Create a shared grocery list</h1>
  <p class="mt-2 text-slate-700">Anyone with the generated link can edit your list.</p>

  <div class="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <label for="title" class="block text-sm font-medium text-slate-700">List title</label>
    <input
      id="title"
      bind:value={title}
      on:keydown={handleTitleKeydown}
      class="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
      placeholder="Weekly groceries"
    />
    <button
      class="mt-4 rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
      on:click={createList}
      disabled={creating}
    >
      {creating ? 'Creating…' : 'Create share link'}
    </button>
    {#if error}
      <p class="mt-2 text-sm text-red-600">{error}</p>
    {/if}
  </div>
</main>
