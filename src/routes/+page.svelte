<script lang="ts">
	import { imageStore } from '$lib/stores/image.svelte.js';
	import ImageViewer from '$lib/components/ImageViewer.svelte';
	import ContextMenu from '$lib/components/ContextMenu.svelte';
	import EditDialog from '$lib/components/EditDialog.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import HistoryStrip from '$lib/components/HistoryStrip.svelte';
	import type { Zone } from '$lib/schemas/detect.js';

	type Action = 'replace' | 'freeform' | 'add' | 'remove';

	// Context menu state
	let contextOpen = $state(false);
	let contextPos = $state({ x: 0, y: 0 });
	let contextZones = $state<Zone[]>([]);
	let contextBox = $state<[number, number, number, number] | undefined>(undefined);
	let contextCursor = $state<[number, number] | undefined>(undefined);

	// Edit dialog state
	let dialogOpen = $state(false);
	let editAction = $state<Action>('add');
	let editTargets = $state<Zone[]>([]);
	let editBox = $state<[number, number, number, number] | undefined>(undefined);
	let editCursor = $state<[number, number] | undefined>(undefined);

	// Sidebar overlay (small screens)
	let sidebarOpen = $state(false);

	function handleFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		imageStore.loadFile(file);
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		const file = e.dataTransfer?.files[0];
		if (file?.type.startsWith('image/')) imageStore.loadFile(file);
	}

	function handleImageContextMenu(
		e: MouseEvent,
		detail:
			| { kind: 'point'; cursor: [number, number]; zone: Zone | null }
			| { kind: 'selection'; box: [number, number, number, number]; zones: Zone[] }
	) {
		if (detail.kind === 'selection') {
			contextZones = detail.zones;
			contextBox = detail.box;
			contextCursor = undefined;
		} else {
			contextZones = detail.zone ? [detail.zone] : [];
			contextBox = detail.zone?.box_2d;
			contextCursor = detail.cursor;
		}
		contextPos = { x: e.clientX, y: e.clientY };
		contextOpen = true;
	}

	function handleContextAction(action: Action) {
		contextOpen = false;

		if (action === 'remove' && contextZones.length > 0) {
			imageStore.sendRemove(contextZones, contextBox, contextCursor);
			return;
		}

		editAction = action;
		editTargets = action === 'replace' ? contextZones : [];
		editBox = contextBox;
		editCursor = contextCursor;
		dialogOpen = true;
	}

	function dismissContext() {
		contextOpen = false;
	}
</script>

<svelte:window onclick={dismissContext} />

<div class="flex h-screen flex-col">
	<!-- Header -->
	<div class="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">
		<h1 class="text-2xl font-bold">Dressing Room</h1>
		{#if imageStore.imageData}
			<button
				class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 lg:hidden"
				onclick={() => (sidebarOpen = !sidebarOpen)}
			>
				{sidebarOpen ? 'Close presets' : 'Presets'}
			</button>
		{/if}
	</div>

	<!-- Content -->
	{#if !imageStore.imageData}
		<div class="flex flex-1 items-center justify-center p-8">
			<label
				class="flex h-64 w-full max-w-2xl cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 transition-colors hover:border-gray-500"
				ondragover={(e) => e.preventDefault()}
				ondrop={handleDrop}
			>
				<span class="text-lg text-gray-500">Drop an image here or click to upload</span>
				<input type="file" accept="image/*" class="hidden" onchange={handleFileChange} />
			</label>
		</div>
	{:else if sidebarOpen}
		<div class="min-h-0 flex-1 lg:hidden">
			<Sidebar />
		</div>
	{:else}
		<div class="flex min-h-0 flex-1 gap-6 p-6">
			<HistoryStrip />
			<ImageViewer oncontextmenu={handleImageContextMenu} />
			<div class="hidden lg:flex">
				<Sidebar />
			</div>
		</div>
	{/if}
</div>

<ContextMenu
	open={contextOpen}
	pos={contextPos}
	zones={contextZones}
	onaction={handleContextAction}
/>

<EditDialog
	open={dialogOpen}
	action={editAction}
	targets={editTargets}
	box={editBox}
	cursor={editCursor}
	onclose={() => (dialogOpen = false)}
/>
