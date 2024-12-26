import { prisma } from '@/prisma/prisma-client';
import { CategoryForm } from './components/category-form';

const CategoryPage = async ({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) => {
  const { categoryId } = await params;
  const category = await prisma.category.findUnique({
    where: {
      id: Number(categoryId),
    },
  });

  return (
    <div className='flex-col'>
      <div className='flex-1 p-8 pt-6 space-y-4'>
        <CategoryForm initialData={category} />
      </div>
    </div>
  );
};

export default CategoryPage;
