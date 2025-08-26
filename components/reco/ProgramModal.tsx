import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ProgramModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  reason: string;
}

export default function ProgramModal({ open, onOpenChange, name, reason }: ProgramModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{name}</DialogTitle>
        </DialogHeader>
        <p className="mb-4">{reason}</p>
        <Button asChild>
          <a href="/plan">Continue to Plan Generator</a>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
