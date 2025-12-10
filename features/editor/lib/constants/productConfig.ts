import type { ProductType } from '@/features/editor/lib/types/plan';

export type ProductConfig = {
  value: ProductType;
  labelKey: string;
  descriptionKey: string;
  icon: string;
};

export const PRODUCT_TYPE_CONFIG: ProductConfig[] = [
  {
    value: 'strategy' as ProductType,
    labelKey: 'planTypes.strategy.title',
    descriptionKey: 'planTypes.strategy.subtitle',
    icon: '💡'
  },
  {
    value: 'review' as ProductType,
    labelKey: 'planTypes.review.title',
    descriptionKey: 'planTypes.review.subtitle',
    icon: '✏️'
  },
  {
    value: 'submission' as ProductType,
    labelKey: 'planTypes.custom.title',
    descriptionKey: 'planTypes.custom.subtitle',
    icon: '📋'
  }
] as const;

