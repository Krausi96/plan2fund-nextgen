import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';

type SkipDialogProps = {
  open: boolean;
  skipReason: 'not_applicable' | 'later' | 'unclear' | 'other' | null;
  skipNote: string;
  onOpenChange: (open: boolean) => void;
  onReasonChange: (reason: 'not_applicable' | 'later' | 'unclear' | 'other' | null) => void;
  onNoteChange: (note: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export function SkipDialog({
  open,
  skipReason,
  skipNote,
  onOpenChange,
  onReasonChange,
  onNoteChange,
  onConfirm,
  onCancel
}: SkipDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Skip this question?</DialogTitle>
          <DialogDescription className="text-white/70">
            Why are you skipping this question? This helps us improve the experience.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Skip Reason Options */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="skipReason"
                value="not_applicable"
                checked={skipReason === 'not_applicable'}
                onChange={(e) => onReasonChange(e.target.value as typeof skipReason)}
                className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 focus:ring-blue-500"
              />
              <span className="text-sm text-white/90">Not applicable to my business</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="skipReason"
                value="later"
                checked={skipReason === 'later'}
                onChange={(e) => onReasonChange(e.target.value as typeof skipReason)}
                className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 focus:ring-blue-500"
              />
              <span className="text-sm text-white/90">I'll come back to this later</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="skipReason"
                value="unclear"
                checked={skipReason === 'unclear'}
                onChange={(e) => onReasonChange(e.target.value as typeof skipReason)}
                className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 focus:ring-blue-500"
              />
              <span className="text-sm text-white/90">I don't understand the question</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="skipReason"
                value="other"
                checked={skipReason === 'other'}
                onChange={(e) => onReasonChange(e.target.value as typeof skipReason)}
                className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 focus:ring-blue-500"
              />
              <span className="text-sm text-white/90">Other reason...</span>
            </label>
          </div>
          
          {/* Optional Note */}
          <div>
            <label className="block text-sm text-white/70 mb-1">Optional note:</label>
            <textarea
              value={skipNote}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Add any additional context..."
              className="w-full min-h-[60px] rounded-lg border border-white/20 bg-slate-700/50 p-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="text-white/80 border-white/20 bg-slate-700/50 hover:bg-slate-700"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!skipReason}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Skip Question
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

