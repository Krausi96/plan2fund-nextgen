import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";

type InfoDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: React.ReactNode;
};

export default function InfoDrawer({ isOpen, onClose, title, content }: InfoDrawerProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="prose prose-sm max-w-none">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
}

