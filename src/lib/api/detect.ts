import { openrouter } from './client.js';
import {
	detectResponse,
	detectResponseJsonSchema,
	type DetectResponse
} from '../schemas/detect.js';

const DETECT_MODEL = 'google/gemini-3-flash-preview';

const DETECT_INSTRUCTIONS =
	'You are a clothing detection system. Given an image of a character, identify all visible clothing items and accessories.';

export async function detect(imageBase64: string, signal?: AbortSignal): Promise<DetectResponse> {
	const response = await openrouter.responses.create(
		{
			model: DETECT_MODEL,
			instructions: DETECT_INSTRUCTIONS,
			input: [
				{
					role: 'developer',
					content: [
						{
							type: 'input_image',
							image_url: imageBase64,
							detail: 'high'
						}
					]
				}
			],
			text: {
				format: {
					type: 'json_schema',
					name: 'detect_response',
					schema: detectResponseJsonSchema,
					strict: true
				}
			}
		},
		{ signal }
	);

	const text = response.output_text;
	console.log('[detect] raw response text:', text);
	const json: unknown = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
	console.log('[detect] parsed JSON:', JSON.stringify(json, null, 2));
	const result = detectResponse.safeParse(json);
	if (!result.success) {
		throw new Error(`Failed to parse detection response: ${JSON.stringify(result.error)}`);
	}
	return result.data;
}
