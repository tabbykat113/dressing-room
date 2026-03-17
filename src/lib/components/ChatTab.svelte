<script lang="ts">
	import { imageStore } from '$lib/stores/image.svelte.js';

	$effect(() => {
		imageStore.chatLog.length;
		imageStore.markChatRead();
	});
</script>

<div class="flex h-full flex-col gap-3">
	{#if imageStore.chatLog.length === 0}
		<p class="text-sm text-gray-400">
			{#if imageStore.profile}
				No reactions yet. Make some changes and see how {imageStore.profile.name} reacts!
			{:else}
				Analyze the image first to unlock character reactions.
			{/if}
		</p>
	{:else}
		<div class="flex flex-col gap-2">
			{#each imageStore.chatLog as msg, i (i)}
				<div class="rounded-lg bg-white px-3 py-2 shadow-sm">
					<div class="text-xs font-medium text-cyan-600">{msg.name}</div>
					<div class="text-sm text-gray-700">{msg.text}</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
