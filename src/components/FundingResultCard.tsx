import React, { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

interface FundingResultCardProps {
  program: {
    id: string;
    name: string;
    score: number;
    reason: string;
    eligibility: string[];
    confidence: "high" | "medium" | "low";
  };
}

const confidenceColors: Record<"high" | "medium" | "low", string> = {
  high: "bg-green-500",
  medium: "bg-yellow-500",
  low: "bg-red-500",
};

export const FundingResultCard: React.FC<FundingResultCardProps> = ({ program }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          className="rounded-2xl shadow-md hover:shadow-lg cursor-pointer transition"
          onClick={() => setOpen(true)}
        >
          <CardContent className="p-6 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{program.name}</h3>
              <span
                className={`text-xs px-2 py-1 rounded ${confidenceColors[program.confidence]} text-white`}
              >
                {program.confidence.toUpperCase()}
              </span>
            </div>

            <p className="text-sm text-gray-600">{program.reason}</p>

            <div className="flex flex-wrap gap-2">
              {program.eligibility.map((tag, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Score: {program.score}%</span>
              <Info size={18} className="text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{program.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-700">{program.reason}</p>
            <div>
              <h4 className="font-medium">Eligibility:</h4>
              <ul className="list-disc list-inside text-sm text-gray-600">
                {program.eligibility.map((tag, idx) => (
                  <li key={idx}>{tag}</li>
                ))}
              </ul>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm">Confidence:</span>
              <span
                className={`px-2 py-1 rounded text-white text-xs ${confidenceColors[program.confidence]}`}
              >
                {program.confidence}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => navigate("/plan")} className="w-full flex items-center justify-center">
              Continue to Plan Generator
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
