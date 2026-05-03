import { NextResponse } from 'next/server';

import { prisma } from '@/prisma/prisma-client';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ storyId: string }> };

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

export async function GET(_req: Request, { params }: Params) {
  try {
    const { storyId } = await params;

    if (!storyId) {
      return new NextResponse('Story id is required', { status: 400 });
    }

    const story = await prisma.story.findUnique({
      where: { id: Number(storyId) },
      include: {
        items: {
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!story) {
      return new NextResponse('Story not found', { status: 404 });
    }

    return NextResponse.json(story);
  } catch (err) {
    console.log('[STORY_GET]', err);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { storyId } = await params;
    const body = (await req.json()) as StoryBody;
    const validation = validateBody(body);

    if (!storyId) {
      return new NextResponse('Story id is required', { status: 400 });
    }

    if ('error' in validation) {
      return new NextResponse(validation.error, { status: 400 });
    }

    const id = Number(storyId);

    await prisma.story.update({
      where: { id },
      data: {
        previewImageUrl: body.previewImageUrl as string,
      },
    });

    await prisma.storyItem.deleteMany({
      where: { storyId: id },
    });

    for (const item of validation.items) {
      await prisma.storyItem.create({
        data: {
          storyId: id,
          sourceUrl: item.sourceUrl,
        },
      });
    }

    const story = await prisma.story.findUnique({
      where: { id },
      include: { items: true },
    });

    return NextResponse.json(story);
  } catch (err) {
    console.log('[STORY_PATCH]', err);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { storyId } = await params;

    if (!storyId) {
      return new NextResponse('Story id is required', { status: 400 });
    }

    const id = Number(storyId);

    await prisma.storyItem.deleteMany({
      where: { storyId: id },
    });

    const story = await prisma.story.delete({
      where: { id },
    });

    return NextResponse.json(story);
  } catch (err) {
    console.log('[STORY_DELETE]', err);
    return new NextResponse('Internal error', { status: 500 });
  }
}
