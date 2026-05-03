import { format } from 'date-fns';

import { prisma } from '@/prisma/prisma-client';

import { StoryClient } from './components/client';
import { StoryColumn } from './components/columns';

export const dynamic = 'force-dynamic';

const StoriesPage = async () => {
  const stories = await prisma.story.findMany({
    include: {
      items: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const formattedStories: StoryColumn[] = stories.map((story) => ({
    id: story.id,
    previewImageUrl: story.previewImageUrl,
    itemsCount: story.items.length,
    createdAt: format(story.createdAt, 'MMMM do, yyyy'),
  }));

  return (
    <div className='flex-col'>
      <div className='flex-1 p-8 pt-6 space-y-4'>
        <StoryClient data={formattedStories} />
      </div>
    </div>
  );
};

export default StoriesPage;
