import { openrouter } from './client.js';
import {
	reactionResponse,
	reactionResponseJsonSchema,
	type Reaction
} from '../schemas/reaction.js';
import type { Profile } from '../schemas/profile.js';
import type { Zone } from '../schemas/detect.js';

const REACTION_MODEL = 'google/gemini-3-flash-preview';

export async function generateReaction(
	profile: Profile,
	zones: Zone[],
	action: string,
	signal?: AbortSignal
): Promise<Reaction> {
	const zoneLabels = zones.map((z) => z.label).join(', ');

	const instructions = `You are roleplaying as a character. Stay fully in character. Your response must match the voice and personality described below exactly.

Character: ${profile.name} (${profile.source})
Species: ${profile.species}
Personality: ${profile.personality}
Appearance: ${profile.appearance}
Voice: ${profile.voice}

React to what the user just did to you. Be expressive and natural. Keep it to 1-2 short sentences.`;

	const prompt = `Your current visible clothing/accessories: ${zoneLabels || 'nothing detected'}

What just happened: ${action}

React in character.`;

	const response = await openrouter.responses.create(
		{
			model: REACTION_MODEL,
			instructions,
			input: [
				{
					role: 'developer',
					content: [{ type: 'input_text', text: prompt }]
				}
			],
			text: {
				format: {
					type: 'json_schema',
					name: 'reaction_response',
					schema: reactionResponseJsonSchema,
					strict: true
				}
			}
		},
		{ signal }
	);

	const text = response.output_text;
	console.log('[reaction] raw response text:', text);
	const json: unknown = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
	const result = reactionResponse.safeParse(json);
	if (!result.success) {
		throw new Error(`Failed to parse reaction response: ${JSON.stringify(result.error)}`);
	}
	return result.data;
}
