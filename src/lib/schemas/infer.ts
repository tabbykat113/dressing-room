import { z } from 'zod';

export const inferResponse = z.object({
	underneath: z
		.string()
		.describe(
			'A concise description of what would be visible if the target item were removed. Describe the specific garment, skin, or body part that would be revealed, considering the character style, personality, and what other clothing is visible.'
		)
});

export const inferResponseJsonSchema = z.toJSONSchema(inferResponse);

export type InferResponse = z.infer<typeof inferResponse>;
