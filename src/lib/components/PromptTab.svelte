<script lang="ts">
	import { presetStore } from '$lib/stores/presets.svelte.js';
</script>

<div class="flex flex-col gap-3">
	<p class="text-sm text-gray-500">
		Add a freeform instruction. This will be appended to any selected presets, or sent on its own.
	</p>
	<textarea
		class="min-h-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
		placeholder="e.g. Make the lighting dramatic and moody"
		bind:value={presetStore.freePrompt}
	></textarea>
</div>
