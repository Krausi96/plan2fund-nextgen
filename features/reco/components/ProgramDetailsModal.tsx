import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/components/ui/dialog";

type ProgramDetailsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  program: {
    id: string;
    name: string;
    source?: string;
    deadlines?: string[];
    cofinancing_pct?: number;
    docs_required?: string[];
    evidence_links?: string[];
    region?: string;
    funding_type?: string;
    ceiling?: number;
  } | null;
};

export default function ProgramDetailsModal({ isOpen, onClose, program }: ProgramDetailsModalProps) {
  if (!program) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{program.name}</DialogTitle>
          <DialogDescription>Detailed program information</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {program.source && (
            <div>
              <h4 className="font-semibold">Official Source</h4>
              <a 
                href={program.source} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {program.source}
              </a>
            </div>
          )}

          {program.region && (
            <div>
              <h4 className="font-semibold">Region</h4>
              <p>{program.region}</p>
            </div>
          )}

          {program.funding_type && (
            <div>
              <h4 className="font-semibold">Funding Type</h4>
              <p>{program.funding_type}</p>
            </div>
          )}

          {program.ceiling && (
            <div>
              <h4 className="font-semibold">Maximum Amount</h4>
              <p>€{program.ceiling.toLocaleString()}</p>
            </div>
          )}

          {program.cofinancing_pct && (
            <div>
              <h4 className="font-semibold">Co-financing Required</h4>
              <p>{program.cofinancing_pct}%</p>
            </div>
          )}

          {program.deadlines && program.deadlines.length > 0 && (
            <div>
              <h4 className="font-semibold">Application Deadlines</h4>
              <ul className="list-disc list-inside">
                {program.deadlines.map((deadline, i) => (
                  <li key={i}>{new Date(deadline).toLocaleDateString()}</li>
                ))}
              </ul>
            </div>
          )}

          {program.docs_required && program.docs_required.length > 0 && (
            <div>
              <h4 className="font-semibold">Required Documents</h4>
              <ul className="list-disc list-inside">
                {program.docs_required.map((doc, i) => (
                  <li key={i}>{doc}</li>
                ))}
              </ul>
            </div>
          )}

          {program.evidence_links && program.evidence_links.length > 0 && (
            <div>
              <h4 className="font-semibold">Additional Resources</h4>
              <ul className="list-disc list-inside">
                {program.evidence_links.map((link, i) => (
                  <li key={i}>
                    <a 
                      href={link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}