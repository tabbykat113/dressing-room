<script lang="ts">
	import { presetStore } from '$lib/stores/presets.svelte.js';
	import type { Category } from '$lib/presets.js';

	interface Props {
		category: Category;
	}

	let { category }: Props = $props();
</script>

<div class="flex flex-col gap-2">
	<div class="flex justify-end">
		<button
			class="text-xs {presetStore.hasSelection(category.id)
				? 'text-gray-400 hover:text-gray-600'
				: 'pointer-events-none text-transparent'}"
			onclick={() => presetStore.clearCategory(category.id)}
		>
			Clear
		</button>
	</div>
	{#each category.presets as preset (preset.name)}
		<button
			class="rounded-lg border bg-white px-3 py-2.5 text-left transition-colors {presetStore.isSelected(
				category.id,
				preset.name
			)
				? 'border-cyan-400 bg-cyan-50'
				: 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}"
			onclick={() => presetStore.toggle(category.id, preset.name)}
		>
			<div class="font-medium">{preset.name}</div>
			<div class="text-xs text-gray-400">{preset.description}</div>
		</button>
	{/each}
</div>
