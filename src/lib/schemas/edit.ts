import { z } from 'zod';

export const replaceResponse = z.object({
	image: z.string()
});

export type ReplaceResponse = z.infer<typeof replaceResponse>;
