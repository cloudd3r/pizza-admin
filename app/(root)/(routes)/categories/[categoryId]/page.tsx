import { prisma } from '@/prisma/prisma-client';
import { CategoryForm } from './components/category-form';

const EditCategoryPage = async ({
  params,
}: {
  params: { categoryId: string };
}) => {
  const category = await prisma.category.findUnique({
    where: {
      id: Number(params.categoryId),
    },
  });

  if (!category) {
    // Обработка случая, если категория не найдена
    return <div>Category not found</div>;
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
