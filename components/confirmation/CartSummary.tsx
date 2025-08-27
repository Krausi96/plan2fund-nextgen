import { Card } from '@/components/ui/card';

export interface CartSummaryProps {
  items: { name: string; price: number }[];
  total: number;
}

export function CartSummary({ items, total }: CartSummaryProps) {
  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-2">Order Summary</h3>
      <ul>
        {items.map((item, idx) => (
          <li key={idx} className="flex justify-between text-sm py-1">
            <span>{item.name}</span>
            <span>\</span>
          </li>
        ))}
      </ul>
      <div className="flex justify-between font-bold mt-3">
        <span>Total</span>
        <span>\</span>
      </div>
    </Card>
  );
}
