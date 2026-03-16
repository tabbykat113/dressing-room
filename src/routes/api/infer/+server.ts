import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { inferUnderneath } from '$lib/api/infer.js';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { image, zones, targets } = body;

	if (typeof image !== 'string' || !Array.isArray(zones) || !Array.isArray(targets)) {
		return json({ error: 'Missing image, zones, or targets' }, { status: 400 });
	}

	try {
		const result = await inferUnderneath(image, zones, targets, request.signal);
		return json(result);
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Inference failed';
		return json({ error: message }, { status: 502 });
	}
};
