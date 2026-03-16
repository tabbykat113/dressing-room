<script lang="ts">
	import PresetListTab from './PresetListTab.svelte';
	import PromptTab from './PromptTab.svelte';
	import { categories } from '$lib/presets.js';
	import { presetStore } from '$lib/stores/presets.svelte.js';
	import { imageStore } from '$lib/stores/image.svelte.js';

	type Tab = string;

	const tabs = [
		...categories.map((c) => ({ id: c.id, label: c.label })),
		{ id: 'prompt', label: 'Prompt' }
	];

	let activeTab = $state<Tab>('outfits');

	const activeCategory = $derived(categories.find((c) => c.id === activeTab));
</script>

<div
	class="flex h-full w-full shrink-0 flex-col border-gray-200 bg-gray-50 lg:w-[28rem] lg:rounded-lg lg:border"
>
	<div class="flex shrink-0 border-b border-gray-200">
		{#each tabs as tab (tab.id)}
			<button
				class="relative flex-1 px-2 py-3 text-sm font-medium transition-colors {activeTab === tab.id
					? 'border-b-2 border-cyan-600 text-cyan-600'
					: 'text-gray-500 hover:text-gray-700'}"
				onclick={() => (activeTab = tab.id)}
			>
				{tab.label}
				{#if tab.id === 'prompt' ? presetStore.freePrompt.trim() : presetStore.hasSelection(tab.id)}
					<span class="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-cyan-500"></span>
				{/if}
			</button>
		{/each}
	</div>

	<div class="min-h-0 flex-1 overflow-y-auto p-4">
		{#if activeCategory}
			<PresetListTab category={activeCategory} />
		{:else if activeTab === 'prompt'}
			<PromptTab />
		{/if}
	</div>

	{#if presetStore.hasAny}
		<div class="shrink-0 border-t border-gray-200 px-4 py-3">
			<div class="mb-2 flex flex-wrap gap-1">
				{#each presetStore.selectedNames as name (name)}
					<span class="rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-medium text-cyan-700">
						{name}
					</span>
				{/each}
				{#if presetStore.freePrompt.trim()}
					<span class="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
						+ prompt
					</span>
				{/if}
			</div>
			<div class="flex items-center gap-2">
				<button
					class="flex-1 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 disabled:opacity-50"
					onclick={() => presetStore.apply()}
					disabled={imageStore.editing}
				>
					{imageStore.editing ? 'Applying...' : 'Apply'}
				</button>
				<button
					class="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100"
					onclick={() => presetStore.clearAll()}
				>
					Clear all
				</button>
			</div>
		</div>
	{/if}
</div>
