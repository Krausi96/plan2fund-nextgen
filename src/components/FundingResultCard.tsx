import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FundingResultCardProps {
  programName: string;
  score: number;
  reason: string;
  eligibility: boolean;
  confidence: number;
  details: string;
}

export default function FundingResultCard({
  programName,
  score,
  reason,
  eligibility,
  confidence,
}: FundingResultCardProps) {
  const confidenceLabel =
    confidence >= 0.8 ? "High" : confidence >= 0.6 ? "Medium" : "Low";
  const confidenceColor =
    confidence >= 0.8
      ? "bg-green-500"
      : confidence >= 0.6
      ? "bg-yellow-500"
      : "bg-red-500";

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="rounded-2xl shadow-md hover:shadow-lg transition"
    >
      <Card>
        <CardContent className="p-6 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{programName}</h3>
            <span
              className={`text-xs px-2 py-1 rounded text-white ${confidenceColor}`}
            >
              {confidenceLabel}
            </span>
          </div>

          <p className="text-sm text-gray-600">{reason}</p>

          <div className="flex gap-2">
            <Badge variant={eligibility ? "default" : "destructive"}>
              {eligibility ? "Eligible" : "Not Eligible"}
            </Badge>
            <Badge variant="secondary">{score}% match</Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
