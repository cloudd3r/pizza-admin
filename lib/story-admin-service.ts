import { z } from 'zod';

export const storyBodySchema = z.object({
  previewImageUrl: z.string().trim().url('Preview image URL must be valid'),
  items: z
    .array(
      z.object({
        sourceUrl: z.string().trim().url('Item source URL must be valid'),
      }),
    )
    .min(1, 'At least one story item is required'),
});

export type StoryBody = z.infer<typeof storyBodySchema>;
