import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PricingPanel() {
  const [priority, setPriority] = useState(false);

  const basePrice = 1000;
  const price = priority ? basePrice * 1.5 : basePrice;

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Pricing</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <span>Delivery Mode:</span>
          <Button
            variant="outline"
            onClick={() => setPriority(!priority)}
          >
            {priority ? "Priority" : "Standard"}
          </Button>
        </div>
        <p className="text-2xl font-bold mb-2">€{price.toFixed(0)}</p>
        <p className="text-sm text-gray-500 mb-4">
          {priority
            ? "Priority delivery (extra cost)"
            : "Standard delivery"}
        </p>
        <Button asChild>
          <a href="/confirmation">Continue</a>
        </Button>
      </CardContent>
    </Card>
  );
}
