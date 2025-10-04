import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, FileText, CheckCircle } from 'lucide-react';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: string;
    title: string;
    purpose: string;
    sections: string[];
    inputs: string[];
    outputs: string[];
    limits: string;
    formatHints?: string[];
  };
}

export function DocumentModal({ isOpen, onClose, document }: DocumentModalProps) {
  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="w-5 h-5" />
            {document.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Purpose */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Purpose</h3>
            <p className="text-gray-600">{document.purpose}</p>
          </div>

          {/* Sections */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Sections</h3>
            <ul className="space-y-1">
              {document.sections.map((section, index) => (
                <li key={index} className="flex items-center gap-2 text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {section}
                </li>
              ))}
            </ul>
          </div>

          {/* Inputs */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Inputs</h3>
            <p className="text-gray-600">{document.inputs.join(', ')}</p>
          </div>

          {/* Outputs */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Outputs</h3>
            <p className="text-gray-600">{document.outputs}</p>
          </div>

          {/* Format Hints */}
          {document.formatHints && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Format</h3>
              <div className="flex flex-wrap gap-2">
                {document.formatHints.map((hint, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                    {hint}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Limits */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Limits</h3>
            <p className="text-gray-600">{document.limits}</p>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
