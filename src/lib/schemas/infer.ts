import { z } from 'zod';

export const inferResponse = z.object({
	area_after: z
		.string()
		.describe(
			'A concise description of what the affected area should look like after the target item is removed. Include both what is revealed (skin, underlayers) AND any neighboring items that must remain intact. For example: "bare legs and feet, with the black heeled shoes still on" or "a white undershirt, with the belt and pants unchanged".'
		)
});

export const inferResponseJsonSchema = z.toJSONSchema(inferResponse);

export type InferResponse = z.infer<typeof inferResponse>;
