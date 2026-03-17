import type { Zone } from '$lib/schemas/detect.js';

export interface HistoryEntry {
	image: string;
	zones: Zone[];
	parentIndex: number | null;
}

interface Job {
	abort: AbortController;
	sourceIndex: number;
}

let history = $state<HistoryEntry[]>([]);
let historyIndex = $state(-1);
let job = $state<Job | null>(null);
let jobPhase = $state<'detecting' | 'editing' | null>(null);
let error = $state<string | null>(null);
let showZones = $state(false);

function currentEntry(): HistoryEntry | null {
	if (historyIndex < 0 || historyIndex >= history.length) return null;
	return history[historyIndex];
}

function appendEntry(image: string, zones: Zone[], parentIndex: number | null): number {
	const idx = history.length;
	history = [...history, { image, zones, parentIndex }];
	return idx;
}

async function detectForImage(image: string, signal: AbortSignal): Promise<Zone[]> {
	const res = await fetch('/api/detect', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ image }),
		signal
	});
	const data = await res.json();
	if (data.error) throw new Error(data.error);
	return data.zones;
}

export const imageStore = {
	get imageData() {
		return currentEntry()?.image ?? null;
	},
	get zones() {
		return currentEntry()?.zones ?? [];
	},
	get history() {
		return history;
	},
	get historyIndex() {
		return historyIndex;
	},
	get detecting() {
		return jobPhase === 'detecting';
	},
	get editing() {
		return jobPhase === 'editing';
	},
	get error() {
		return error;
	},
	get showZones() {
		return showZones;
	},
	set showZones(v: boolean) {
		showZones = v;
	},
	get busy() {
		return job !== null;
	},

	abort() {
		if (!job) return;
		job.abort.abort();
		job = null;
		jobPhase = null;
	},

	loadFile(file: File) {
		const reader = new FileReader();
		reader.onload = async () => {
			const image = reader.result as string;
			history = [];
			historyIndex = -1;
			error = null;
			job = null;
			jobPhase = null;

			// Show the image immediately with empty zones
			const idx = appendEntry(image, [], null);
			historyIndex = idx;

			const abort = new AbortController();
			job = { abort, sourceIndex: idx };
			jobPhase = 'detecting';
			try {
				const zones = await detectForImage(image, abort.signal);
				history = history.map((e, i) => (i === idx ? { ...e, zones } : e));
			} catch (e) {
				if (e instanceof DOMException && e.name === 'AbortError') return;
				error = e instanceof Error ? e.message : 'Detection failed';
			} finally {
				job = null;
				jobPhase = null;
			}
		};
		reader.readAsDataURL(file);
	},

	clear() {
		this.abort();
		history = [];
		historyIndex = -1;
		error = null;
	},

	restoreEntry(index: number) {
		if (index < 0 || index >= history.length) return;
		historyIndex = index;
		error = null;
	},

	clearHistory() {
		const entry = currentEntry();
		if (!entry) return;
		history = [{ image: entry.image, zones: [...entry.zones], parentIndex: null }];
		historyIndex = 0;
	},

	async detectZones() {
		const entry = currentEntry();
		if (!entry || job) return;

		const abort = new AbortController();
		job = { abort, sourceIndex: historyIndex };
		jobPhase = 'detecting';
		error = null;
		try {
			const zones = await detectForImage(entry.image, abort.signal);
			// Update the current entry's zones in place
			const idx = historyIndex;
			history = history.map((e, i) => (i === idx ? { ...e, zones } : e));
		} catch (e) {
			if (e instanceof DOMException && e.name === 'AbortError') return;
			error = e instanceof Error ? e.message : 'Detection failed';
		} finally {
			job = null;
			jobPhase = null;
		}
	},

	async sendEdit(
		prompt: string,
		box?: [number, number, number, number],
		cursor?: [number, number]
	) {
		const entry = currentEntry();
		if (!entry || job) return;

		const sourceImage = entry.image;
		const sourceIndex = historyIndex;
		const abort = new AbortController();
		job = { abort, sourceIndex };
		jobPhase = 'editing';
		error = null;
		try {
			const res = await fetch('/api/edit', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ image: sourceImage, prompt, box, cursor }),
				signal: abort.signal
			});
			const data = await res.json();
			if (data.error) throw new Error(data.error);
			const newImage = data.image.startsWith('data:')
				? data.image
				: `data:image/png;base64,${data.image}`;

			// Detect zones on the new image
			jobPhase = 'detecting';
			let newZones: Zone[] = [];
			try {
				newZones = await detectForImage(newImage, abort.signal);
			} catch {
				// Detection failure is non-fatal — still add the entry
			}

			const idx = appendEntry(newImage, newZones, sourceIndex);
			historyIndex = idx;
		} catch (e) {
			if (e instanceof DOMException && e.name === 'AbortError') return;
			error = e instanceof Error ? e.message : 'Edit failed';
		} finally {
			job = null;
			jobPhase = null;
		}
	},

	async sendRemove(
		targets: Zone[],
		box?: [number, number, number, number],
		cursor?: [number, number]
	) {
		const entry = currentEntry();
		if (!entry || job || targets.length === 0) return;

		const sourceImage = entry.image;
		const sourceZones = entry.zones;
		const sourceIndex = historyIndex;
		const abort = new AbortController();
		job = { abort, sourceIndex };
		jobPhase = 'editing';
		error = null;
		try {
			const labels = targets.map((z) => z.label);
			const inferRes = await fetch('/api/infer', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					image: sourceImage,
					zones: sourceZones,
					targets: labels
				}),
				signal: abort.signal
			});
			const inferData = await inferRes.json();
			if (inferData.error) throw new Error(inferData.error);

			const labelStr = labels.join(', ');
			const prompt = `Remove the ${labelStr} from this image. The area should show: ${inferData.area_after}.`;
			console.log('[remove] enhanced prompt:', prompt);

			const editRes = await fetch('/api/edit', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ image: sourceImage, prompt, box, cursor }),
				signal: abort.signal
			});
			const editData = await editRes.json();
			if (editData.error) throw new Error(editData.error);
			const newImage = editData.image.startsWith('data:')
				? editData.image
				: `data:image/png;base64,${editData.image}`;

			jobPhase = 'detecting';
			let newZones: Zone[] = [];
			try {
				newZones = await detectForImage(newImage, abort.signal);
			} catch {
				// Detection failure is non-fatal
			}

			const idx = appendEntry(newImage, newZones, sourceIndex);
			historyIndex = idx;
		} catch (e) {
			if (e instanceof DOMException && e.name === 'AbortError') return;
			error = e instanceof Error ? e.message : 'Remove failed';
		} finally {
			job = null;
			jobPhase = null;
		}
	},

	hitTestZone(cursor: [number, number]): Zone | null {
		const entry = currentEntry();
		if (!entry) return null;
		const [cy, cx] = cursor;
		const sorted = [...entry.zones].sort((a, b) => b.z_index - a.z_index);
		for (const zone of sorted) {
			const [y0, x0, y1, x1] = zone.box_2d;
			if (cy >= y0 && cy <= y1 && cx >= x0 && cx <= x1) {
				return zone;
			}
		}
		return null;
	},

	hitTestZones(box: [number, number, number, number]): Zone[] {
		const entry = currentEntry();
		if (!entry) return [];
		const [sy0, sx0, sy1, sx1] = box;
		return entry.zones.filter((zone) => {
			const [zy0, zx0, zy1, zx1] = zone.box_2d;
			return sy0 < zy1 && sy1 > zy0 && sx0 < zx1 && sx1 > zx0;
		});
	}
};
