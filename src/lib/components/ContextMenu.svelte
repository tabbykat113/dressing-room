<script lang="ts">
	import { imageStore } from '$lib/stores/image.svelte.js';
	import type { Zone } from '$lib/schemas/detect.js';

	type Action = 'replace' | 'freeform' | 'add' | 'remove';

	interface Props {
		open: boolean;
		pos: { x: number; y: number };
		zones: Zone[];
		onaction: (action: Action) => void;
	}

	let { open, pos, zones, onaction }: Props = $props();

	const zoneLabel = $derived(
		zones.length === 1 ? zones[0].label : zones.map((z) => z.label).join(', ')
	);
</script>

{#if open}
	<div
		class="fixed z-50 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
		style="top: {pos.y}px; left: {pos.x}px"
		onclick={(e) => e.stopPropagation()}
	>
		{#if imageStore.detecting}
			<div class="px-4 py-2 text-sm text-gray-400">Analyzing...</div>
		{:else}
			{#if zones.length > 0}
				<div class="border-b border-gray-100 px-4 py-1.5 text-xs font-medium text-gray-400">
					{zoneLabel}
				</div>
				<button
					class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
					onclick={() => onaction('replace')}
				>
					Replace{zones.length > 1 ? ` (${zones.length})` : ''}
				</button>
				<button
					class="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
					onclick={() => onaction('remove')}
				>
					Remove{zones.length > 1 ? ` (${zones.length})` : ''}
				</button>
			{/if}
			<button
				class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
				onclick={() => onaction('freeform')}
			>
				Replace...
			</button>
			<button
				class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
				onclick={() => onaction('add')}
			>
				Add
			</button>
		{/if}
	</div>
{/if}
