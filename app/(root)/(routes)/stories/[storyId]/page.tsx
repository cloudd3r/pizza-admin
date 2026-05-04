import { prisma } from '@/prisma/prisma-client';

import { StoryForm } from './components/story-form';

export const dynamic = 'force-dynamic';

type StoryPageProps = {
  params: Promise<{ storyId: string }>;
};

const StoryPage = async ({ params }: StoryPageProps) => {
  const { storyId } = await params;

  const story =
    storyId === 'new'
      ? null
      : await prisma.story.findUnique({
          where: {
            id: Number(storyId),
          },
          include: {
            items: {
              orderBy: {
                id: 'asc',
              },
            },
          },
        });

  return (
    <div className='flex-col'>
      <div className='flex-1 p-8 pt-6 space-y-4'>
        <StoryForm initialData={story} />
      </div>
    </div>
  );
};

export default StoryPage;
