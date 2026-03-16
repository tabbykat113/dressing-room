<script lang="ts">
	import { imageStore } from '$lib/stores/image.svelte.js';
	import type { Zone } from '$lib/schemas/detect.js';

	type Action = 'replace' | 'freeform' | 'add';

	interface Props {
		open: boolean;
		action: Action;
		targets: Zone[];
		box?: [number, number, number, number];
		cursor?: [number, number];
		onclose: () => void;
	}

	let { open, action, targets, box, cursor, onclose }: Props = $props();

	let prompt = $state('');
	let freeformWhat = $state('');

	function canConfirm(): boolean {
		if (!prompt.trim()) return false;
		if (action === 'freeform' && !freeformWhat.trim()) return false;
		return true;
	}

	function targetLabel(): string {
		if (targets.length === 1) return targets[0].label;
		return targets.map((z) => z.label).join(', ');
	}

	function buildPrompt(): string {
		switch (action) {
			case 'replace':
				return `Replace the ${targetLabel()} in this image with: ${prompt.trim()}`;
			case 'freeform':
				return `Replace ${freeformWhat.trim()} in this image with: ${prompt.trim()}`;
			case 'add':
				return `Add the following to this image: ${prompt.trim()}`;
		}
	}

	async function confirm() {
		if (!canConfirm()) return;
		const builtPrompt = buildPrompt();
		prompt = '';
		freeformWhat = '';
		onclose();
		await imageStore.sendEdit(builtPrompt, box, cursor);
	}

	function cancel() {
		prompt = '';
		freeformWhat = '';
		onclose();
	}

	const title = $derived(
		action === 'replace' && targets.length > 0
			? `Replace: ${targetLabel()}`
			: action === 'freeform'
				? 'Replace'
				: 'Add clothing'
	);
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
		<div
			class="flex w-96 flex-col gap-4 rounded-xl bg-white p-6 shadow-xl"
			onclick={(e) => e.stopPropagation()}
		>
			<h2 class="text-lg font-semibold">{title}</h2>
			{#if action === 'freeform'}
				<input
					type="text"
					class="rounded-lg border border-gray-300 px-3 py-2 focus:border-cyan-500 focus:outline-none"
					placeholder="What to replace"
					bind:value={freeformWhat}
				/>
				<input
					type="text"
					class="rounded-lg border border-gray-300 px-3 py-2 focus:border-cyan-500 focus:outline-none"
					placeholder="Replace with"
					bind:value={prompt}
					onkeydown={(e) => e.key === 'Enter' && confirm()}
				/>
			{:else if action === 'replace'}
				<input
					type="text"
					class="rounded-lg border border-gray-300 px-3 py-2 focus:border-cyan-500 focus:outline-none"
					placeholder="What should it become?"
					bind:value={prompt}
					onkeydown={(e) => e.key === 'Enter' && confirm()}
				/>
			{:else}
				<input
					type="text"
					class="rounded-lg border border-gray-300 px-3 py-2 focus:border-cyan-500 focus:outline-none"
					placeholder="What should be added?"
					bind:value={prompt}
					onkeydown={(e) => e.key === 'Enter' && confirm()}
				/>
			{/if}
			<div class="flex justify-end gap-2">
				<button
					class="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
					onclick={cancel}
				>
					Cancel
				</button>
				<button
					class="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 disabled:opacity-50"
					onclick={confirm}
					disabled={imageStore.editing || !canConfirm()}
				>
					{imageStore.editing ? 'Generating...' : 'Confirm'}
				</button>
			</div>
		</div>
	</div>
{/if}
