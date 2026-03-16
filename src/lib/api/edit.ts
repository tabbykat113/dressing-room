import { openrouter } from './client.js';

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

	const response = await openrouter.responses.create(
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

	for (const item of response.output) {
		if (item.type === 'image_generation_call' && item.result) {
			return item.result;
		}
	}

	throw new Error('No image found in response');
}
