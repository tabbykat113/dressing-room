import { openrouter } from './client.js';
import { inferResponse, inferResponseJsonSchema, type InferResponse } from '../schemas/infer.js';
import type { Zone } from '../schemas/detect.js';

const INFER_MODEL = 'google/gemini-3-flash-preview';

const INFER_INSTRUCTIONS = `You are analyzing an image of a character to predict what an area should look like after a clothing item is removed.

Consider:
- What is underneath the item (other garments, bare skin, body parts)
- What neighboring items are adjacent to or overlapping the item and must remain intact
- The character's apparent style, setting, and personality
- If the character is a known/recognizable one, what they would canonically wear
- The logical layering and spatial relationships of the visible outfit

Describe the complete expected state of the affected area after removal — both what is newly visible AND what nearby items should be preserved unchanged.

Be specific and concise. For example: "bare legs and feet, with the black heeled shoes still on" or "a white undershirt tucked into the pants, with the belt unchanged" or "bare skin, with the necklace and earrings still in place".`;

export async function inferRemovalResult(
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

After removing ${targetList}, what should the affected area look like? Describe both what would be revealed and what neighboring items should remain unchanged.`;

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
