import { z } from 'zod';

export const profileResponse = z.object({
	name: z
		.string()
		.describe(
			'Character name if recognizable, or a fitting descriptive title if unknown (e.g. "The Knight", "Pink-haired Girl")'
		),
	source: z
		.string()
		.describe(
			'Source material if recognizable (e.g. "Evangelion", "Genshin Impact"), or "Original Character" if unknown'
		),
	species: z
		.string()
		.describe('What the character is — "human", "catgirl", "anthropomorphic fox", "robot", etc.'),
	personality: z.string().describe('Core personality traits and demeanor in a few words'),
	appearance: z
		.string()
		.describe(
			'Brief physical description beyond clothing — hair, eyes, build, distinguishing features'
		),
	voice: z
		.string()
		.describe(
			'How the character speaks — sentence structure, vocabulary, verbal tics, formality level, cultural speech patterns. This should fully capture how dialogue from this character would read.'
		)
});

export const profileResponseJsonSchema = z.toJSONSchema(profileResponse);

export type Profile = z.infer<typeof profileResponse>;
