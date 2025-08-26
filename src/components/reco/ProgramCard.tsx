import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ProgramCardProps {
  name: string;
  score: number;
  eligibility: "Eligible" | "Not Eligible";
  confidence: "High" | "Medium" | "Low";
  reason: string;
}

export default function ProgramCard({
  name,
  score,
  eligibility,
  confidence,
  reason,
}: ProgramCardProps) {
  return (
    <Card className="shadow-md hover:shadow-lg transition mb-4">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          {name}
          <span className="text-blue-600 font-bold">{score}%</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-2 text-sm">{reason}</p>
        <div className="flex gap-2 mb-4">
          <Badge variant={eligibility === "Eligible" ? "default" : "destructive"}>
            {eligibility}
          </Badge>
          <Badge>{confidence} Confidence</Badge>
        </div>
        <Button asChild>
          <a href="/plan">Continue to Plan Generator</a>
        </Button>
      </CardContent>
    </Card>
  );
}
