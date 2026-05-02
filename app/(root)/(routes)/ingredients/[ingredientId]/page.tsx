import { Ingredient } from '@prisma/client';

import { prisma } from '@/prisma/prisma-client';

import { IngredientForm } from './components/ingredient-form';

const EditIngredientPage = async ({
  params,
}: {
  params: Promise<{ ingredientId: string }>;
}) => {
  const { ingredientId } = await params;

  let ingredient: Ingredient | null = null;

  if (ingredientId !== 'new') {
    ingredient = await prisma.ingredient.findUnique({
      where: { id: Number(ingredientId) },
    });

    if (!ingredient) {
      return <div>Ingredient not found</div>;
    }
  }

  return (
    <div className='flex-col'>
      <div className='flex-1 p-8 pt-6 space-y-4'>
        <IngredientForm initialData={ingredient} />
      </div>
    </div>
  );
};

export default EditIngredientPage;
