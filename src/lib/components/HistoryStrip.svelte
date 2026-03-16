<script lang="ts">
	import { imageStore } from '$lib/stores/image.svelte.js';
</script>

<div class="flex w-20 shrink-0 flex-col gap-2 overflow-y-auto">
	<div class="flex items-center justify-between">
		<span class="text-xs font-medium text-gray-400">History</span>
		{#if imageStore.history.length > 1}
			<button
				class="text-xs text-red-400 hover:text-red-600"
				onclick={() => imageStore.clearHistory()}
			>
				Clear
			</button>
		{/if}
	</div>
	{#each imageStore.history as entry, i (i)}
		<button
			class="overflow-hidden rounded border-2 transition-colors {i === imageStore.historyIndex
				? 'border-cyan-400'
				: 'border-transparent hover:border-gray-300'}"
			onclick={() => imageStore.restoreEntry(i)}
		>
			<img src={entry.image} alt="History {i + 1}" class="block w-full" />
		</button>
	{/each}
</div>
