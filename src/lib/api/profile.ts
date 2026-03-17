import { openrouter } from './client.js';
import { profileResponse, profileResponseJsonSchema, type Profile } from '../schemas/profile.js';
import { logRequest, logResponse, classifyError } from './log.js';

const TAG = 'profile';
const PROFILE_MODEL = 'google/gemini-3-flash-preview';

const PROFILE_INSTRUCTIONS = `You are analyzing an image of a character to build a profile for them.

Your goal is to capture who this character is so that someone could write convincing dialogue for them without seeing the image. Be specific and avoid generic descriptions.

If you recognize the character, use their canonical name and source material. If not, invent a fitting title based on their appearance and give "Original Character" as the source.

For the voice field, focus on how their dialogue would actually read — not just adjectives, but concrete speech patterns. For example: "speaks in short, clipped sentences with military jargon" or "bubbly and energetic, uses lots of exclamation marks and casual slang, occasionally drops in Japanese words like sugoi or kawaii".`;

export async function generateProfile(imageBase64: string, signal?: AbortSignal): Promise<Profile> {
	logRequest(TAG, PROFILE_MODEL);

	let response;
	try {
		response = await openrouter.responses.create(
			{
				model: PROFILE_MODEL,
				instructions: PROFILE_INSTRUCTIONS,
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
								text: 'Analyze this character and build a profile for them.'
							}
						]
					}
				],
				text: {
					format: {
						type: 'json_schema',
						name: 'profile_response',
						schema: profileResponseJsonSchema,
						strict: true
					}
				}
			},
			{ signal }
		);
	} catch (e) {
		throw new Error(classifyError(e, 'Profile'));
	}

	logResponse(TAG, response);

	const text = response.output_text;
	console.log(`[${TAG}] raw response text:`, text);
	const json: unknown = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
	console.log(`[${TAG}] parsed JSON:`, JSON.stringify(json, null, 2));
	const result = profileResponse.safeParse(json);
	if (!result.success) {
		throw new Error(`Profile returned invalid data: ${JSON.stringify(result.error)}`);
	}
	return result.data;
}
