import { NextResponse } from 'next/server';
import { z } from 'zod';

import { invalidateAdminDataCache } from '@/lib/admin-data-cache';
import { apiError, apiInternalError, apiZodError } from '@/lib/api-error';
import { requireAdmin } from '@/lib/require-admin';
import { storyBodySchema } from '@/lib/story-admin-service';
import { prisma } from '@/prisma/prisma-client';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ storyId: string }> };

const parseStoryId = (raw: string | undefined) => {
  if (!raw) return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export async function GET(_req: Request, { params }: Params) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const { storyId } = await params;
    const id = parseStoryId(storyId);
    if (!id) return apiError('Story id is required', 400);

    const story = await prisma.story.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!story) return apiError('Story not found', 404);

    return NextResponse.json(story);
  } catch (err) {
    return apiInternalError('STORY_GET', err);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const { storyId } = await params;
    const id = parseStoryId(storyId);
    if (!id) return apiError('Story id is required', 400);

    const raw = await req.json();
    const parsed = storyBodySchema.parse(raw);

    await prisma.story.update({
      where: { id },
      data: {
        previewImageUrl: parsed.previewImageUrl,
      },
    });

    await prisma.storyItem.deleteMany({
      where: { storyId: id },
    });

    for (const item of parsed.items) {
      await prisma.storyItem.create({
        data: {
          storyId: id,
          sourceUrl: item.sourceUrl,
        },
      });
    }
    invalidateAdminDataCache();

    const story = await prisma.story.findUnique({
      where: { id },
      include: { items: true },
    });

    return NextResponse.json(story);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiZodError(err);
    }
    return apiInternalError('STORY_PATCH', err);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const { storyId } = await params;
    const id = parseStoryId(storyId);
    if (!id) return apiError('Story id is required', 400);

    await prisma.storyItem.deleteMany({
      where: { storyId: id },
    });

    const story = await prisma.story.delete({
      where: { id },
    });
    invalidateAdminDataCache();

    return NextResponse.json(story);
  } catch (err) {
    return apiInternalError('STORY_DELETE', err);
  }
}
