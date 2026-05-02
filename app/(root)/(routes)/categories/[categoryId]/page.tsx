import { Category } from '@prisma/client';

import { prisma } from '@/prisma/prisma-client';
import { CategoryForm } from './components/category-form';

const EditCategoryPage = async ({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) => {
  const { categoryId } = await params;

  let category: Category | null = null;

  if (categoryId !== 'new') {
    category = await prisma.category.findUnique({
      where: {
        id: Number(categoryId),
      },
    });

    if (!category) {
      return <div>Category not found</div>;
    }
  }

  return (
    <div className='flex-col'>
      <div className='flex-1 p-8 pt-6 space-y-4'>
        <CategoryForm initialData={category} />
      </div>
    </div>
  );
};

export default EditCategoryPage;
