import { NextResponse } from 'next/server';
import { z } from 'zod';

import { invalidateAdminDataCache } from '@/lib/admin-data-cache';
import { apiInternalError, apiZodError } from '@/lib/api-error';
import { requireAdmin } from '@/lib/require-admin';
import { storyBodySchema } from '@/lib/story-admin-service';
import { prisma } from '@/prisma/prisma-client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const raw = await req.json();
    const parsed = storyBodySchema.parse(raw);

    const story = await prisma.story.create({
      data: {
        previewImageUrl: parsed.previewImageUrl,
      },
    });

    for (const item of parsed.items) {
      await prisma.storyItem.create({
        data: {
          storyId: story.id,
          sourceUrl: item.sourceUrl,
        },
      });
    }
    invalidateAdminDataCache();

    const storyWithItems = await prisma.story.findUnique({
      where: { id: story.id },
      include: { items: true },
    });

    return NextResponse.json(storyWithItems);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiZodError(err);
    }
    return apiInternalError('STORIES_POST', err);
  }
}
