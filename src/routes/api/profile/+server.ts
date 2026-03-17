import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { generateProfile } from '$lib/api/profile.js';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const image: unknown = body.image;

	if (typeof image !== 'string') {
		return json({ error: 'Missing image' }, { status: 400 });
	}

	try {
		const result = await generateProfile(image, request.signal);
		return json(result);
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Profile generation failed';
		return json({ error: message }, { status: 502 });
	}
};
