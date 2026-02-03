export type ProductType = 'submission' | 'strategy' | 'upgrade';

export type ProductOption = {
  value: ProductType;
  label: string;
  description: string;
  icon?: string;
};