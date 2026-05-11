import { Promo } from '@prisma/client';

import { prisma } from '@/prisma/prisma-client';

import { PromoForm } from './components/promo-form';

export const dynamic = 'force-dynamic';

const EditPromoPage = async ({
  params,
}: {
  params: Promise<{ promoId: string }>;
}) => {
  const { promoId } = await params;

  let promo: Promo | null = null;

  if (promoId !== 'new') {
    promo = await prisma.promo.findUnique({
      where: { id: Number(promoId) },
    });

    if (!promo) {
      return <div className='p-8'>Promo not found</div>;
    }
  }

  return (
    <div className='flex-col'>
      <div className='flex-1 p-8 pt-6 space-y-4'>
        <PromoForm initialData={promo} />
      </div>
    </div>
  );
};

export default EditPromoPage;
