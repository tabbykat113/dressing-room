import type { Zone } from '$lib/schemas/detect.js';
import type { Profile } from '$lib/schemas/profile.js';

export interface HistoryEntry {
	image: string;
	zones: Zone[];
	parentIndex: number | null;
}

export interface ChatMessage {
	name: string;
	text: string;
}

interface Job {
	abort: AbortController;
	sourceIndex: number;
}

let history = $state<HistoryEntry[]>([]);
let historyIndex = $state(-1);
let job = $state<Job | null>(null);
let jobPhase = $state<'detecting' | 'editing' | 'profiling' | null>(null);
let error = $state<string | null>(null);
let showZones = $state(false);
let profile = $state<Profile | null>(null);
let chatLog = $state<ChatMessage[]>([]);

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

async function fetchReaction(
	p: Profile,
	zones: Zone[],
	action: string,
	signal: AbortSignal
): Promise<string | null> {
	try {
		const res = await fetch('/api/reaction', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ profile: p, zones, action }),
			signal
		});
		const data = await res.json();
		if (data.error) {
			console.warn('[reaction] error:', data.error);
			return null;
		}
		return data.message;
	} catch {
		return null;
	}
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
	get profiling() {
		return jobPhase === 'profiling';
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
	get profile() {
		return profile;
	},
	get chatLog() {
		return chatLog;
	},

	abort() {
		if (!job) return;
		job.abort.abort();
		job = null;
		jobPhase = null;
	},

	loadFile(file: File) {
		const reader = new FileReader();
		reader.onload = () => {
			const image = reader.result as string;
			history = [];
			historyIndex = -1;
			error = null;
			job = null;
			jobPhase = null;
			profile = null;
			chatLog = [];

			const idx = appendEntry(image, [], null);
			historyIndex = idx;
		};
		reader.readAsDataURL(file);
	},

	clear() {
		this.abort();
		history = [];
		historyIndex = -1;
		error = null;
		profile = null;
		chatLog = [];
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

	async analyze() {
		const entry = currentEntry();
		if (!entry || job) return;

		const abort = new AbortController();
		const idx = historyIndex;
		job = { abort, sourceIndex: idx };
		error = null;

		// Run detection and profile generation in parallel
		jobPhase = 'detecting';
		const [zonesResult, profileResult] = await Promise.allSettled([
			detectForImage(entry.image, abort.signal),
			fetch('/api/profile', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ image: entry.image }),
				signal: abort.signal
			}).then((r) => r.json())
		]);

		// Check abort before applying results
		if (abort.signal.aborted) return;

		if (zonesResult.status === 'fulfilled') {
			history = history.map((e, i) => (i === idx ? { ...e, zones: zonesResult.value } : e));
		} else {
			const e = zonesResult.reason;
			if (e instanceof DOMException && e.name === 'AbortError') return;
			error = e instanceof Error ? e.message : 'Detection failed';
		}

		if (profileResult.status === 'fulfilled' && !profileResult.value.error) {
			profile = profileResult.value;
			console.log('[profile] generated:', JSON.stringify(profile, null, 2));
		} else {
			console.warn('[profile] failed, reactions will be unavailable');
		}

		job = null;
		jobPhase = null;
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
		const sourceZones = entry.zones;
		const sourceIndex = historyIndex;
		const abort = new AbortController();
		job = { abort, sourceIndex };
		jobPhase = 'editing';
		error = null;
		try {
			// Fire edit + reaction in parallel
			const editPromise = fetch('/api/edit', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ image: sourceImage, prompt, box, cursor }),
				signal: abort.signal
			});

			const reactionPromise = profile
				? fetchReaction(profile, sourceZones, prompt, abort.signal)
				: Promise.resolve(null);

			const [editRes, reactionText] = await Promise.all([editPromise, reactionPromise]);

			const data = await editRes.json();
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
				// Detection failure is non-fatal
			}

			const idx = appendEntry(newImage, newZones, sourceIndex);
			historyIndex = idx;

			if (reactionText && profile) {
				chatLog = [...chatLog, { name: profile.name, text: reactionText }];
			}
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
			const labelStr = labels.join(', ');

			// Infer removal result
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

			const prompt = `Remove the ${labelStr} from this image. The area should show: ${inferData.area_after}.`;
			console.log('[remove] enhanced prompt:', prompt);

			// Fire edit + reaction in parallel
			const editPromise = fetch('/api/edit', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ image: sourceImage, prompt, box, cursor }),
				signal: abort.signal
			});

			const reactionAction = `The user removed: ${labelStr}`;
			const reactionPromise = profile
				? fetchReaction(profile, sourceZones, reactionAction, abort.signal)
				: Promise.resolve(null);

			const [editRes, reactionText] = await Promise.all([editPromise, reactionPromise]);

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

			if (reactionText && profile) {
				chatLog = [...chatLog, { name: profile.name, text: reactionText }];
			}
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
