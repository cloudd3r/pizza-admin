import { NextResponse } from 'next/server';

import { invalidateAdminDataCache } from '@/lib/admin-data-cache';
import { prisma } from '@/prisma/prisma-client';

export const dynamic = 'force-dynamic';

type StoryBody = {
  previewImageUrl?: string;
  items?: Array<{
    sourceUrl?: string;
  }>;
};

const normalizeItems = (items?: StoryBody['items']) =>
  items
    ?.map((item) => ({ sourceUrl: item.sourceUrl?.trim() ?? '' }))
    .filter((item) => item.sourceUrl) ?? [];

const validateBody = (body: StoryBody) => {
  const items = normalizeItems(body.items);

  if (!body.previewImageUrl) {
    return { error: 'Preview image is required' };
  }

  if (!items.length) {
    return { error: 'At least one story item is required' };
  }

  return { items };
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as StoryBody;
    const validation = validateBody(body);

    if ('error' in validation) {
      return new NextResponse(validation.error, { status: 400 });
    }

    const story = await prisma.story.create({
      data: {
        previewImageUrl: body.previewImageUrl as string,
      },
    });

    for (const item of validation.items) {
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
    console.log('[STORIES_POST]', err);
    return new NextResponse('Internal error', { status: 500 });
  }
}
