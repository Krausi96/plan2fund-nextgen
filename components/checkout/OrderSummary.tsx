import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OrderSummary() {
  return (
    <Card className="mb-6 shadow-sm">
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-2">
          <span>Selected Program</span>
          <span className="font-medium">AWS PreSeed</span>
        </div>
        <div className="flex justify-between">
          <span>Total</span>
          <span className="font-bold">€1000</span>
        </div>
      </CardContent>
    </Card>
  );
}
