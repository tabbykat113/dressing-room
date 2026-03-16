import { z } from 'zod';

const boundingBox = z
	.tuple([z.number(), z.number(), z.number(), z.number()])
	.describe('Bounding box as [y0, x0, y1, x1] where coordinates are in 0-1000 range');

const zone = z.object({
	label: z.string().describe('Short descriptive name of the clothing item'),
	box_2d: boundingBox,
	z_index: z
		.number()
		.int()
		.describe(
			'Depth layer: 0 = skin/innermost, higher = outermost. Used to resolve overlapping zones'
		)
});

export const detectResponse = z.object({
	zones: z.array(zone)
});

export const detectResponseJsonSchema = z.toJSONSchema(detectResponse);

export type BoundingBox = z.infer<typeof boundingBox>;
export type Zone = z.infer<typeof zone>;
export type DetectResponse = z.infer<typeof detectResponse>;
