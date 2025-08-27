import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";

type EligibilityProps = {
  program: string;
  score: number;
  eligible: boolean;
  confidence: "High" | "Medium" | "Low";
};

export default function EligibilityCard({ program, score, eligible, confidence }: EligibilityProps) {
  const confidenceColors: Record<string, string> = {
    High: "bg-blue-500 text-white",
    Medium: "bg-yellow-500 text-white",
    Low: "bg-gray-400 text-white",
  };

  return (
    <Card className="p-6 shadow-md flex flex-col gap-3">
      <h3 className="text-lg font-semibold">{program}</h3>
      <p className="text-sm text-gray-600">Match score: {score}%</p>
      <div className="flex gap-2">
        <Badge variant={eligible ? "default" : "destructive"}>
          {eligible ? "✅ Eligible" : "❌ Not Eligible"}
        </Badge>
        <Badge className={confidenceColors[confidence]}>
          🔵 {confidence} Confidence
        </Badge>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Info size={14} /> Confidence reflects data match quality.
      </div>
    </Card>
  );
}


