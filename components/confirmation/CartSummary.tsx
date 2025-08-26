import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CartSummaryProps {
  program?: string;
  price?: number;
}

export default function CartSummary({ program = "AWS PreSeed", price = 1000 }: CartSummaryProps) {
  return (
    <Card className="mb-6 shadow-sm">
      <CardHeader>
        <CardTitle>Cart Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-2">
          <span>Selected Program</span>
          <span className="font-medium">{program}</span>
        </div>
        <div className="flex justify-between">
          <span>Price</span>
          <span className="font-bold">€{price}</span>
        </div>
      </CardContent>
    </Card>
  );
}
