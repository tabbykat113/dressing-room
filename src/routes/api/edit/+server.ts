import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { editImage } from '$lib/api/edit.js';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { image, prompt, box, cursor } = body;

	if (typeof image !== 'string' || typeof prompt !== 'string') {
		return json({ error: 'Missing image or prompt' }, { status: 400 });
	}
	try {
		const result = await editImage({
			image,
			prompt,
			cursor: Array.isArray(cursor) && cursor.length === 2 ? cursor : undefined,
			box: Array.isArray(box) && box.length === 4 ? box : undefined,
			signal: request.signal
		});
		return json({ image: result });
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Edit failed';
		return json({ error: message }, { status: 502 });
	}
};
