import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle } from "lucide-react";

export interface FundingResultCardProps {
  programName: string;
  score: number;
  reason: string;
  eligibility: boolean;
  confidence: number;
}

export default function FundingResultCard({
  programName,
  score,
  reason,
  eligibility,
  confidence,
}: FundingResultCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white shadow-md rounded-2xl p-6 flex flex-col justify-between hover:shadow-lg transition"
    >
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{programName}</h3>
        <p className="text-sm text-gray-600 mb-4">{reason}</p>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex space-x-2">
          <Badge
            className={eligibility ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
          >
            {eligibility ? (
              <CheckCircle size={14} className="mr-1" />
            ) : (
              <AlertCircle size={14} className="mr-1" />
            )}
            {eligibility ? "Eligible" : "Not Eligible"}
          </Badge>
          <Badge className="bg-blue-100 text-blue-800">
            Confidence {Math.round(confidence * 100)}%
          </Badge>
        </div>
        <span className="text-lg font-bold text-gray-900">{score}</span>
      </div>
    </motion.div>
  );
}
