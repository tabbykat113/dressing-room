import { openrouter } from './client.js';
import { inferResponse, inferResponseJsonSchema, type InferResponse } from '../schemas/infer.js';
import type { Zone } from '../schemas/detect.js';

const INFER_MODEL = 'google/gemini-3-flash-preview';

const INFER_INSTRUCTIONS = `You are analyzing an image of a character to predict what would be visible underneath a clothing item if it were removed.

Consider:
- What other clothing is visible on the character that might extend under the item
- The character's apparent style, setting, and personality
- If the character is a known/recognizable one, what they would canonically wear
- Whether the item is likely worn over bare skin or over another layer
- The logical layering of the visible outfit

Be specific and concise. For example: "black tights covering the legs and feet" or "bare skin" or "a white undershirt".`;

export async function inferUnderneath(
	imageBase64: string,
	zones: Zone[],
	targets: string[],
	signal?: AbortSignal
): Promise<InferResponse> {
	const zoneList = zones.map((z) => `- ${z.label} (z_index: ${z.z_index})`).join('\n');
	const targetList = targets.join(', ');

	const prompt = `Here are the currently detected clothing zones on this character:
${zoneList}

The user wants to remove: ${targetList}

What would be visible underneath if ${targetList} were removed? Consider the full context of the image, the character, and the visible outfit layering.`;

	const response = await openrouter.responses.create(
		{
			model: INFER_MODEL,
			instructions: INFER_INSTRUCTIONS,
			input: [
				{
					role: 'developer',
					content: [
						{
							type: 'input_image',
							image_url: imageBase64,
							detail: 'high'
						},
						{
							type: 'input_text',
							text: prompt
						}
					]
				}
			],
			text: {
				format: {
					type: 'json_schema',
					name: 'infer_response',
					schema: inferResponseJsonSchema,
					strict: true
				}
			}
		},
		{ signal }
	);

	const text = response.output_text;
	console.log('[infer] raw response text:', text);
	const json: unknown = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
	console.log('[infer] parsed JSON:', JSON.stringify(json, null, 2));
	const result = inferResponse.safeParse(json);
	if (!result.success) {
		throw new Error(`Failed to parse infer response: ${JSON.stringify(result.error)}`);
	}
	return result.data;
}
