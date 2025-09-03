import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ExplorationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddProgram: (program: any) => void;
};

export default function ExplorationModal({ isOpen, onClose, onAddProgram }: ExplorationModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    official_url: "",
    sector: "",
    tags: "",
    note: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const customProgram = {
      id: `custom-${Date.now()}`,
      name: formData.title,
      type: "Custom Program",
      score: 0,
      reason: "Custom program added via Exploration Mode",
      eligibility: "Unknown",
      confidence: "Low" as const,
      custom: true,
      source: formData.official_url || undefined,
      sector: formData.sector ? [formData.sector] : [],
      tags: formData.tags ? formData.tags.split(",").map(t => t.trim()) : [],
      note: formData.note,
      why: ["Custom program - eligibility not verified"]
    };

    onAddProgram(customProgram);
    setFormData({ title: "", official_url: "", sector: "", tags: "", note: "" });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Custom Program</DialogTitle>
          <DialogDescription>
            Add a funding program we don't track yet. This is for exploration only.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Program Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border rounded p-2"
              placeholder="e.g., Local Innovation Grant"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Official URL</label>
            <input
              type="url"
              value={formData.official_url}
              onChange={(e) => setFormData({ ...formData, official_url: e.target.value })}
              className="w-full border rounded p-2"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Sector</label>
            <input
              type="text"
              value={formData.sector}
              onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
              className="w-full border rounded p-2"
              placeholder="e.g., technology, healthcare, creative"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tags</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full border rounded p-2"
              placeholder="grant, startup, local (comma-separated)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full border rounded p-2 h-20"
              placeholder="Any additional information..."
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add Program
            </Button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
          <strong>Note:</strong> This program will be added to your results for exploration only. 
          Eligibility and scoring are not verified. Use this feature to test programs we don't track yet.
        </div>
      </DialogContent>
    </Dialog>
  );
}

