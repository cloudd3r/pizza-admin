import { Prisma, PromoKind } from '@prisma/client';
import { z } from 'zod';

import { prisma } from '@/prisma/prisma-client';

const promoCodeRegex = /^[A-Z0-9_-]+$/;

const nullableInt = (label: string) =>
  z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return null;
      const num = typeof val === 'number' ? val : Number(val);
      return Number.isFinite(num) ? num : val;
    },
    z
      .number({ invalid_type_error: `${label} must be a number` })
      .int(`${label} must be an integer`)
      .nonnegative(`${label} must be non-negative`)
      .nullable(),
  );

const nullableDateTime = (label: string) =>
  z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return null;
      if (val instanceof Date) return val;
      if (typeof val === 'string') {
        const date = new Date(val);
        return Number.isNaN(date.getTime()) ? val : date;
      }
      return val;
    },
    z.date({ invalid_type_error: `${label} must be a date` }).nullable(),
  );

const nullableDescription = z.preprocess(
  (val) => {
    if (val === null || val === undefined) return null;
    if (typeof val === 'string') {
      const trimmed = val.trim();
      return trimmed === '' ? null : trimmed;
    }
    return val;
  },
  z.string().max(500, 'Description is too long').nullable(),
);

export const promoBodySchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2, 'Code must be at least 2 characters')
      .max(64, 'Code must be at most 64 characters')
      .transform((value) => value.toUpperCase())
      .refine(
        (value) => promoCodeRegex.test(value),
        'Code may contain only A–Z, 0–9, "-" and "_"',
      ),
    kind: z.nativeEnum(PromoKind),
    valueOff: z.coerce
      .number()
      .int('valueOff must be an integer')
      .nonnegative('valueOff must be non-negative'),
    minOrderAmount: nullableInt('minOrderAmount'),
    maxDiscount: nullableInt('maxDiscount'),
    validFrom: nullableDateTime('validFrom'),
    validUntil: nullableDateTime('validUntil'),
    usageLimit: nullableInt('usageLimit'),
    perUserLimit: nullableInt('perUserLimit'),
    active: z.coerce.boolean().default(true),
    description: nullableDescription,
  })
  .superRefine((data, ctx) => {
    if (data.kind === 'PERCENT' && (data.valueOff < 1 || data.valueOff > 100)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['valueOff'],
        message: 'PERCENT promo must have valueOff between 1 and 100',
      });
    }
    if (data.kind === 'FIXED' && data.valueOff < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['valueOff'],
        message: 'FIXED promo must have valueOff >= 1',
      });
    }
    if (
      data.validFrom &&
      data.validUntil &&
      data.validUntil.getTime() <= data.validFrom.getTime()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['validUntil'],
        message: 'validUntil must be after validFrom',
      });
    }
  });

export type PromoBody = z.infer<typeof promoBodySchema>;

export const parsePromoId = (raw: string | undefined) => {
  if (!raw) return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export class PromoCodeTakenError extends Error {
  constructor(code: string) {
    super(`Promo code "${code}" already exists`);
    this.name = 'PromoCodeTakenError';
  }
}

export class PromoInUseError extends Error {
  redemptionCount: number;

  constructor(redemptionCount: number) {
    super(`Promo has ${redemptionCount} redemption(s) and cannot be deleted`);
    this.name = 'PromoInUseError';
    this.redemptionCount = redemptionCount;
  }
}

const toData = (body: PromoBody): Prisma.PromoUncheckedCreateInput => ({
  code: body.code,
  kind: body.kind,
  valueOff: Math.round(body.valueOff),
  minOrderAmount: body.minOrderAmount,
  maxDiscount: body.maxDiscount,
  validFrom: body.validFrom,
  validUntil: body.validUntil,
  usageLimit: body.usageLimit,
  perUserLimit: body.perUserLimit,
  active: body.active,
  description: body.description,
});

export const listPromos = () =>
  prisma.promo.findMany({
    orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
    include: {
      _count: { select: { redemptions: true } },
    },
  });

export const getPromo = (id: number) =>
  prisma.promo.findUnique({
    where: { id },
    include: {
      _count: { select: { redemptions: true } },
    },
  });

const isUniqueViolation = (err: unknown) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';

export const createPromo = async (body: PromoBody) => {
  try {
    return await prisma.promo.create({ data: toData(body) });
  } catch (err) {
    if (isUniqueViolation(err)) throw new PromoCodeTakenError(body.code);
    throw err;
  }
};

export const updatePromo = async (id: number, body: PromoBody) => {
  try {
    return await prisma.promo.update({ where: { id }, data: toData(body) });
  } catch (err) {
    if (isUniqueViolation(err)) throw new PromoCodeTakenError(body.code);
    throw err;
  }
};

export const deletePromo = async (id: number) => {
  const redemptionCount = await prisma.promoRedemption.count({
    where: { promoId: id },
  });

  if (redemptionCount > 0) {
    throw new PromoInUseError(redemptionCount);
  }

  return prisma.promo.delete({ where: { id } });
};

export const listPromoRedemptions = (promoId: number) =>
  prisma.promoRedemption.findMany({
    where: { promoId },
    include: {
      order: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          totalAmount: true,
          discountAmount: true,
          status: true,
          createdAt: true,
        },
      },
      user: { select: { id: true, fullName: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
