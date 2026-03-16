import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { detect } from '$lib/api/detect.js';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const image: unknown = body.image;

	if (typeof image !== 'string') {
		return json({ error: 'Missing image' }, { status: 400 });
	}

	try {
		const result = await detect(image, request.signal);
		return json(result);
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Detection failed';
		return json({ error: message }, { status: 502 });
	}
};
