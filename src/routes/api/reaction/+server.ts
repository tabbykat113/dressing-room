import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { generateReaction } from '$lib/api/reaction.js';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { profile, zones, action } = body;

	if (!profile || !Array.isArray(zones) || typeof action !== 'string') {
		return json({ error: 'Missing profile, zones, or action' }, { status: 400 });
	}

	try {
		const result = await generateReaction(profile, zones, action, request.signal);
		return json(result);
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Reaction generation failed';
		return json({ error: message }, { status: 502 });
	}
};
