import type { Zone } from '$lib/schemas/detect.js';

export interface HistoryEntry {
	image: string;
	zones: Zone[];
}

let imageData = $state<string | null>(null);
let zones = $state<Zone[]>([]);
let history = $state<HistoryEntry[]>([]);
let historyIndex = $state(-1);
let detecting = $state(false);
let editing = $state(false);
let error = $state<string | null>(null);
let showZones = $state(false);
let abortController: AbortController | null = null;

function pushEntry() {
	if (!imageData) return;
	history = history.slice(0, historyIndex + 1);
	history.push({ image: imageData, zones: [...zones] });
	historyIndex = history.length - 1;
}

export const imageStore = {
	get imageData() {
		return imageData;
	},
	get zones() {
		return zones;
	},
	get history() {
		return history;
	},
	get historyIndex() {
		return historyIndex;
	},
	get detecting() {
		return detecting;
	},
	get editing() {
		return editing;
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
	get canUndo() {
		return historyIndex > 0;
	},
	get busy() {
		return detecting || editing;
	},

	abort() {
		abortController?.abort();
		abortController = null;
	},

	loadFile(file: File) {
		const reader = new FileReader();
		reader.onload = async () => {
			imageData = reader.result as string;
			zones = [];
			history = [];
			historyIndex = -1;
			error = null;
			await this.detectZones();
			pushEntry();
		};
		reader.readAsDataURL(file);
	},

	clear() {
		imageData = null;
		zones = [];
		history = [];
		historyIndex = -1;
		error = null;
	},

	restoreEntry(index: number) {
		if (index < 0 || index >= history.length) return;
		const entry = history[index];
		imageData = entry.image;
		zones = [...entry.zones];
		historyIndex = index;
	},

	clearHistory() {
		if (!imageData) return;
		history = [{ image: imageData, zones: [...zones] }];
		historyIndex = 0;
	},

	async detectZones() {
		if (!imageData) return;
		detecting = true;
		error = null;
		abortController = new AbortController();
		try {
			const res = await fetch('/api/detect', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ image: imageData }),
				signal: abortController.signal
			});
			const data = await res.json();
			if (data.error) throw new Error(data.error);
			zones = data.zones;
		} catch (e) {
			if (e instanceof DOMException && e.name === 'AbortError') return;
			error = e instanceof Error ? e.message : 'Detection failed';
		} finally {
			detecting = false;
			abortController = null;
		}
	},

	async sendEdit(
		prompt: string,
		box?: [number, number, number, number],
		cursor?: [number, number]
	) {
		if (!imageData) return;
		editing = true;
		error = null;
		abortController = new AbortController();
		try {
			const res = await fetch('/api/edit', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ image: imageData, prompt, box, cursor }),
				signal: abortController.signal
			});
			const data = await res.json();
			if (data.error) throw new Error(data.error);
			imageData = data.image.startsWith('data:')
				? data.image
				: `data:image/png;base64,${data.image}`;
			zones = [];
			await this.detectZones();
			pushEntry();
		} catch (e) {
			if (e instanceof DOMException && e.name === 'AbortError') return;
			error = e instanceof Error ? e.message : 'Edit failed';
		} finally {
			editing = false;
			abortController = null;
		}
	},

	async sendRemove(
		targets: Zone[],
		box?: [number, number, number, number],
		cursor?: [number, number]
	) {
		if (!imageData || targets.length === 0) return;
		editing = true;
		error = null;
		abortController = new AbortController();
		try {
			const labels = targets.map((z) => z.label);
			const res = await fetch('/api/infer', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					image: imageData,
					zones: [...zones],
					targets: labels
				}),
				signal: abortController.signal
			});
			const data = await res.json();
			if (data.error) throw new Error(data.error);

			const labelStr = labels.join(', ');
			const prompt = `Remove the ${labelStr} from this image. The area should show: ${data.area_after}.`;
			console.log('[remove] enhanced prompt:', prompt);

			// Reset editing state — sendEdit will set it again
			editing = false;
			abortController = null;
			await this.sendEdit(prompt, box, cursor);
		} catch (e) {
			if (e instanceof DOMException && e.name === 'AbortError') return;
			error = e instanceof Error ? e.message : 'Remove failed';
			editing = false;
			abortController = null;
		}
	},

	hitTestZone(cursor: [number, number]): Zone | null {
		const [cy, cx] = cursor;
		const sorted = [...zones].sort((a, b) => b.z_index - a.z_index);
		for (const zone of sorted) {
			const [y0, x0, y1, x1] = zone.box_2d;
			if (cy >= y0 && cy <= y1 && cx >= x0 && cx <= x1) {
				return zone;
			}
		}
		return null;
	},

	hitTestZones(box: [number, number, number, number]): Zone[] {
		const [sy0, sx0, sy1, sx1] = box;
		return zones.filter((zone) => {
			const [zy0, zx0, zy1, zx1] = zone.box_2d;
			return sy0 < zy1 && sy1 > zy0 && sx0 < zx1 && sx1 > zx0;
		});
	}
};
