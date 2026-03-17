<script lang="ts">
	import { imageStore } from '$lib/stores/image.svelte.js';
	import type { Zone } from '$lib/schemas/detect.js';

	type ContextDetail =
		| { kind: 'point'; cursor: [number, number]; zone: Zone | null }
		| { kind: 'selection'; box: [number, number, number, number]; zones: Zone[] };

	interface Props {
		oncontextmenu: (e: MouseEvent, detail: ContextDetail) => void;
	}

	let { oncontextmenu }: Props = $props();
	let imageEl = $state<HTMLImageElement | null>(null);

	// Selection state
	let dragging = $state(false);
	let dragStart = $state<{ x: number; y: number } | null>(null);
	let dragEnd = $state<{ x: number; y: number } | null>(null);
	let selection = $state<[number, number, number, number] | null>(null);

	const DRAG_THRESHOLD = 5;

	function normalizedCursor(e: MouseEvent): [number, number] {
		if (!imageEl) return [0, 0];
		const rect = imageEl.getBoundingClientRect();
		const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000);
		const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000);
		return [y, x];
	}

	function pixelToNorm(px: { x: number; y: number }): [number, number] {
		if (!imageEl) return [0, 0];
		const rect = imageEl.getBoundingClientRect();
		const x = Math.round(((px.x - rect.left) / rect.width) * 1000);
		const y = Math.round(((px.y - rect.top) / rect.height) * 1000);
		return [Math.max(0, Math.min(1000, y)), Math.max(0, Math.min(1000, x))];
	}

	function selectionStyle(): { top: string; left: string; width: string; height: string } | null {
		if (!imageEl) return null;
		const box = dragging && dragStart && dragEnd ? dragToBox(dragStart, dragEnd) : selection;
		if (!box) return null;
		const [y0, x0, y1, x1] = box;
		return {
			top: `${(y0 / 1000) * 100}%`,
			left: `${(x0 / 1000) * 100}%`,
			width: `${((x1 - x0) / 1000) * 100}%`,
			height: `${((y1 - y0) / 1000) * 100}%`
		};
	}

	function dragToBox(
		start: { x: number; y: number },
		end: { x: number; y: number }
	): [number, number, number, number] {
		const [sy, sx] = pixelToNorm(start);
		const [ey, ex] = pixelToNorm(end);
		return [Math.min(sy, ey), Math.min(sx, ex), Math.max(sy, ey), Math.max(sx, ex)];
	}

	function handleMouseDown(e: MouseEvent) {
		if (e.button !== 0) return;
		dragStart = { x: e.clientX, y: e.clientY };
		dragEnd = null;
		dragging = false;
	}

	function handleMouseMove(e: MouseEvent) {
		if (!dragStart) return;
		const dx = e.clientX - dragStart.x;
		const dy = e.clientY - dragStart.y;
		if (!dragging && Math.sqrt(dx * dx + dy * dy) >= DRAG_THRESHOLD) {
			dragging = true;
			selection = null;
		}
		if (dragging) {
			dragEnd = { x: e.clientX, y: e.clientY };
		}
	}

	function handleMouseUp(e: MouseEvent) {
		if (e.button !== 0) return;
		if (dragging && dragStart && dragEnd) {
			selection = dragToBox(dragStart, dragEnd);
		} else if (!dragging) {
			// Plain click — clear selection
			selection = null;
		}
		dragging = false;
		dragStart = null;
		dragEnd = null;
	}

	function handleContextMenu(e: MouseEvent) {
		e.preventDefault();
		if (selection) {
			const cursor = normalizedCursor(e);
			const [y0, x0, y1, x1] = selection;
			const [cy, cx] = cursor;
			if (cy >= y0 && cy <= y1 && cx >= x0 && cx <= x1) {
				const zones = imageStore.hitTestZones(selection);
				oncontextmenu(e, { kind: 'selection', box: selection, zones });
				return;
			}
			// Right-clicked outside selection — clear it and fall back to point
			selection = null;
		}
		const cursor = normalizedCursor(e);
		const zone = imageStore.hitTestZone(cursor);
		oncontextmenu(e, { kind: 'point', cursor, zone });
	}

	function scaleBox(zone: Zone): { top: string; left: string; width: string; height: string } {
		const [y0, x0, y1, x1] = zone.box_2d;
		return {
			top: `${(y0 / 1000) * 100}%`,
			left: `${(x0 / 1000) * 100}%`,
			width: `${((x1 - x0) / 1000) * 100}%`,
			height: `${((y1 - y0) / 1000) * 100}%`
		};
	}
</script>

<svelte:window onmousemove={handleMouseMove} onmouseup={handleMouseUp} />

<div class="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
	<div class="relative min-h-0 w-fit flex-1 select-none">
		<img
			bind:this={imageEl}
			src={imageStore.imageData}
			alt="Uploaded"
			class="block max-h-full max-w-full rounded-lg"
			oncontextmenu={handleContextMenu}
			onmousedown={handleMouseDown}
			draggable="false"
		/>
		{#if imageStore.showZones}
			{#each imageStore.zones as zone, i (i)}
				{@const box = scaleBox(zone)}
				<div
					class="pointer-events-none absolute border-2 border-cyan-400 bg-cyan-400/10"
					style="top: {box.top}; left: {box.left}; width: {box.width}; height: {box.height}"
				>
					<span
						class="absolute top-0 left-0 -translate-y-full bg-cyan-400 px-1.5 py-0.5 text-xs font-medium text-black"
					>
						{zone.label}
					</span>
				</div>
			{/each}
		{/if}
		{#if selectionStyle()}
			{@const sel = selectionStyle()!}
			<div
				class="pointer-events-none absolute border-2 border-dashed border-white/80 bg-white/10"
				style="top: {sel.top}; left: {sel.left}; width: {sel.width}; height: {sel.height}"
			></div>
		{/if}
	</div>

	<div class="flex items-center gap-4">
		<button
			class="rounded-lg bg-cyan-600 px-4 py-2 font-medium text-white transition-colors hover:bg-cyan-700 disabled:opacity-50"
			onclick={() => (imageStore.profile ? imageStore.detectZones() : imageStore.analyze())}
			disabled={imageStore.busy}
		>
			{imageStore.detecting || imageStore.profiling
				? 'Analyzing...'
				: imageStore.zones.length
					? 'Re-analyze'
					: 'Analyze Clothing'}
		</button>
		{#if imageStore.zones.length > 0}
			<button
				class="rounded-lg border border-gray-300 px-4 py-2 text-sm transition-colors hover:bg-gray-100"
				onclick={() => (imageStore.showZones = !imageStore.showZones)}
			>
				{imageStore.showZones ? 'Hide zones' : 'Show zones'}
			</button>
		{/if}
		<button
			class="rounded-lg border border-gray-300 px-4 py-2 text-sm transition-colors hover:bg-gray-100"
			onclick={() => {
				const a = document.createElement('a');
				a.href = imageStore.imageData!;
				a.download = 'dressing-room.png';
				a.click();
			}}
		>
			Download
		</button>
		<button
			class="text-sm text-gray-500 underline hover:text-gray-700"
			onclick={() => imageStore.clear()}
		>
			Upload different image
		</button>
	</div>

	<div class="flex h-6 items-center gap-3 text-sm text-gray-500">
		{#if imageStore.editing}
			<p>Generating image...</p>
			<button
				class="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50"
				onclick={() => imageStore.abort()}
			>
				Cancel
			</button>
		{:else if imageStore.detecting}
			<p>Analyzing...</p>
			<button
				class="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50"
				onclick={() => imageStore.abort()}
			>
				Cancel
			</button>
		{:else if imageStore.zones.length > 0}
			<p>
				Detected {imageStore.zones.length} item{imageStore.zones.length === 1 ? '' : 's'}.
				Right-click the image to add or replace clothing.
			</p>
		{:else}
			<p>Click <strong>Analyze Clothing</strong> to detect items in the image.</p>
		{/if}
	</div>

	{#if imageStore.error}
		<div class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
			{imageStore.error}
		</div>
	{/if}
</div>
