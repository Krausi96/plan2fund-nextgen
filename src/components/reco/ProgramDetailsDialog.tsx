import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ProgramDetailsProps = {
  program: {
    id: string;
    name: string;
    type: string;
    score: number;
    reason: string;
    eligibility: string;
    confidence?: "High" | "Medium" | "Low";
    unmetRequirements?: string[];
    link?: string;
    maxAmount?: number | null;
    notes?: string;
  };
};

export default function ProgramDetailsDialog({ program }: ProgramDetailsProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Details</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{program.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p><strong>Type:</strong> {program.type}</p>
          <p><strong>Score:</strong> {program.score}%</p>
          {program.confidence && <p><strong>Confidence:</strong> {program.confidence}</p>}
          <p><strong>Eligibility:</strong> {program.eligibility}</p>
          <p className="text-gray-600">{program.reason}</p>

          {program.unmetRequirements && program.unmetRequirements.length > 0 && (
            <div>
              <p className="font-semibold">Unmet Requirements:</p>
              <ul className="list-disc ml-5 text-red-600">
                {program.unmetRequirements.map((req, idx) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </div>
          )}

          {program.maxAmount && <p><strong>Max Amount:</strong> €{program.maxAmount}</p>}
          {program.notes && <p className="italic text-gray-500">{program.notes}</p>}

          {program.link && (
            <p>
              <a
                href={program.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                Visit official program site
              </a>
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
