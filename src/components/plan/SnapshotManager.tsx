import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

type Snapshot = {
  id: number;
  timestamp: string;
  content: string;
  sections: any[];
};

type SnapshotManagerProps = {
  onRestore: (snapshot: Snapshot) => void;
  currentContent: string;
  currentSections: any[];
};

export default function SnapshotManager({ onRestore, currentContent, currentSections }: SnapshotManagerProps) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [showManager, setShowManager] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState<Snapshot | null>(null);

  useEffect(() => {
    // Load snapshots from localStorage
    const saved = localStorage.getItem("planSnapshots");
    if (saved) {
      try {
        setSnapshots(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse snapshots:", e);
      }
    }
  }, []);

  const saveSnapshot = () => {
    const newSnapshot: Snapshot = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      content: currentContent,
      sections: currentSections
    };

    const updatedSnapshots = [newSnapshot, ...snapshots].slice(0, 5); // Keep max 5
    setSnapshots(updatedSnapshots);
    localStorage.setItem("planSnapshots", JSON.stringify(updatedSnapshots));
  };

  const handleRestore = (snapshot: Snapshot) => {
    setConfirmRestore(snapshot);
  };

  const confirmRestoreAction = () => {
    if (confirmRestore) {
      onRestore(confirmRestore);
      setConfirmRestore(null);
    }
  };

  const deleteSnapshot = (id: number) => {
    const updated = snapshots.filter(s => s.id !== id);
    setSnapshots(updated);
    localStorage.setItem("planSnapshots", JSON.stringify(updated));
  };

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Version History</h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={saveSnapshot}
            className="text-xs"
          >
            Save Snapshot
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowManager(!showManager)}
            className="text-xs"
          >
            {showManager ? "Hide" : "Manage"}
          </Button>
        </div>
      </div>

      {showManager && (
        <div className="space-y-2">
          {snapshots.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No snapshots saved yet
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {snapshots.map((snapshot) => (
                <div key={snapshot.id} className="border rounded p-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {new Date(snapshot.timestamp).toLocaleString()}
                      </div>
                      <div className="text-gray-500">
                        {snapshot.content.length} chars, {snapshot.sections.length} sections
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestore(snapshot)}
                        className="text-xs px-2 py-1"
                      >
                        Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteSnapshot(snapshot.id)}
                        className="text-xs px-2 py-1 text-red-600 hover:text-red-800"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {confirmRestore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="font-semibold mb-3">Confirm Restore</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will replace your current content with the snapshot from{" "}
              <strong>{new Date(confirmRestore.timestamp).toLocaleString()}</strong>.
              Your current changes will be lost.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setConfirmRestore(null)}
                className="text-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmRestoreAction}
                className="text-sm bg-red-600 hover:bg-red-700"
              >
                Restore
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 mt-2">
        {snapshots.length}/5 snapshots saved
      </div>
    </div>
  );
}

