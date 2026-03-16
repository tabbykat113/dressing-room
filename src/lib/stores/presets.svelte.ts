import { categories } from '$lib/presets.js';
import { imageStore } from './image.svelte.js';

const selections = $state<Record<string, string | null>>({});
let freePrompt = $state('');

export const presetStore = {
	get selections() {
		return selections;
	},
	get freePrompt() {
		return freePrompt;
	},
	set freePrompt(v: string) {
		freePrompt = v;
	},

	get hasAny() {
		return Object.values(selections).some((v) => v !== null) || freePrompt.trim().length > 0;
	},

	get selectedNames(): string[] {
		const names: string[] = [];
		for (const cat of categories) {
			const sel = selections[cat.id];
			if (sel) names.push(sel);
		}
		return names;
	},

	isSelected(categoryId: string, presetName: string): boolean {
		return selections[categoryId] === presetName;
	},

	hasSelection(categoryId: string): boolean {
		return selections[categoryId] != null;
	},

	toggle(categoryId: string, presetName: string) {
		selections[categoryId] = selections[categoryId] === presetName ? null : presetName;
	},

	clearCategory(categoryId: string) {
		selections[categoryId] = null;
	},

	clearAll() {
		for (const key of Object.keys(selections)) {
			selections[key] = null;
		}
		freePrompt = '';
	},

	buildPrompt(): string {
		const parts: string[] = [];
		for (const cat of categories) {
			const selName = selections[cat.id];
			if (!selName) continue;
			const preset = cat.presets.find((p) => p.name === selName);
			if (!preset) continue;
			parts.push(cat.template.replace('{}', preset.fragment));
		}
		if (freePrompt.trim()) {
			parts.push(`Also: ${freePrompt.trim()}`);
		}
		return parts.join(' ');
	},

	async apply() {
		const prompt = this.buildPrompt();
		if (!prompt) return;
		await imageStore.sendEdit(prompt);
	}
};
