import { getStoryRows } from '@/lib/admin-data';

import { StoryClient } from './components/client';

export const dynamic = 'force-dynamic';

const StoriesPage = async () => {
  const formattedStories = await getStoryRows();

  return (
    <div className='flex-col'>
      <div className='flex-1 p-8 pt-6 space-y-4'>
        <StoryClient data={formattedStories} />
      </div>
    </div>
  );
};

export default StoriesPage;
