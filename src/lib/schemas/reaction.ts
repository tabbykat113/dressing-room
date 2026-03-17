import { z } from 'zod';

export const reactionResponse = z.object({
	message: z
		.string()
		.describe(
			'A short in-character reaction (1-2 sentences) to what just happened. Must match the character voice and personality.'
		)
});

export const reactionResponseJsonSchema = z.toJSONSchema(reactionResponse);

export type Reaction = z.infer<typeof reactionResponse>;
