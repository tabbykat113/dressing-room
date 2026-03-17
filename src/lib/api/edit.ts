import { openrouter } from './client.js';
import { logRequest, logResponse, classifyError } from './log.js';

const TAG = 'edit';
const EDIT_MODEL = 'google/gemini-3.1-flash-image-preview';

export interface EditParams {
	image: string;
	prompt: string;
	cursor?: [number, number];
	box?: [number, number, number, number];
	signal?: AbortSignal;
}

export async function editImage({
	image,
	prompt,
	cursor,
	box,
	signal
}: EditParams): Promise<string> {
	let fullPrompt = prompt;

	if (cursor || box) {
		const parts: string[] = [];
		if (cursor) {
			const [cy, cx] = cursor;
			parts.push(`The user pointed at approximately [y=${cy}, x=${cx}] (0-1000 range).`);
		}
		if (box) {
			const [y0, x0, y1, x1] = box;
			parts.push(`The target area is bounded by [y0=${y0}, x0=${x0}, y1=${y1}, x1=${x1}].`);
		}
		fullPrompt += '\n\n' + parts.join(' ');
	}

	logRequest(TAG, EDIT_MODEL, `prompt: "${prompt.slice(0, 100)}..."`);

	let response;
	try {
		response = await openrouter.responses.create(
			{
				model: EDIT_MODEL,
				input: [
					{
						role: 'developer',
						content: [
							{
								type: 'input_image',
								image_url: image,
								detail: 'high'
							},
							{
								type: 'input_text',
								text: fullPrompt
							}
						]
					}
				]
			},
			{ signal }
		);
	} catch (e) {
		throw new Error(classifyError(e, 'Image edit'));
	}

	logResponse(TAG, response);

	// Look for generated image
	for (const item of response.output) {
		if (item.type === 'image_generation_call' && item.result) {
			return item.result;
		}
	}

	// No image — check if the model returned text (likely a refusal)
	const text = response.output
		.filter((i) => i.type === 'message')
		.flatMap((i) => i.content)
		.map((p) => (p.type === 'output_text' ? p.text : p.refusal))
		.join('');

	if (text) {
		console.warn(`[${TAG}] model returned text instead of image:`, text.slice(0, 300));
		throw new Error(`Model returned only text and no image: "${text.slice(0, 300)}"`);
	}

	throw new Error('Model returned no image and no text. Check server logs.');
}
