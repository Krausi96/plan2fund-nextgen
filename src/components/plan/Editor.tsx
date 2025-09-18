import { useState, useEffect } from "react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { chapterTemplates } from "@/lib/templates/chapters";
import { loadPlanSections, savePlanSections, type PlanSection } from "@/lib/planStore";
import InfoDrawer from "@/components/common/InfoDrawer";
import AIChat from "@/components/plan/AIChat";
import PlanCoach from "@/components/plan/PlanCoach";
import SnapshotManager from "@/components/plan/SnapshotManager";


type EditorProps = {
  program?: {
    id: string;
    name: string;
    type: string;
    region: string;
    maxAmount: number;
    requirements: string[];
    link: string;
  };
};

export default function Editor({ program }: EditorProps) {
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState(true);
  const [sections, setSections] = useState<PlanSection[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [persona, setPersona] = useState<"newbie" | "expert">("newbie");
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);

  // Load saved draft from localStorage
  useEffect(() => {
    const savedDraft = localStorage.getItem("planDraft");
    if (savedDraft) setContent(savedDraft);

    const loaded = loadPlanSections()
    if (loaded.length > 0) setSections(loaded)
    else {
      const seeded = chapterTemplates.map((t) => ({ id: t.id, title: t.title, content: "" }))
      setSections(seeded)
    }
  }, []);

  // Autosave simulation with persistence
  useEffect(() => {
    if (!saved) {
      const timer = setTimeout(() => {
        // Save locally
        localStorage.setItem("planDraft", content);
        const next = sections.map((s, i) => (i === activeIdx ? { ...s, content } : s))
        setSections(next)
        savePlanSections(next)

        // Save to backend API
        fetch("/api/plan/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ programId: program?.id || "generic", content }),
        }).catch((err) => console.error("Save failed", err));

        setSaved(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [content, saved]);

  return (
    <div className="flex gap-6 p-6">
      {/* Side Navigation */}
      <aside className="w-64 hidden md:block">
        <nav className="space-y-2">
          {sections.map((s, i) => (
            <div
              key={i}
              onClick={() => {
                setActiveIdx(i)
                setContent(sections[i].content || "")
              }}
              className={`text-sm py-1 px-2 rounded cursor-pointer ${i === activeIdx ? "bg-blue-50" : "hover:bg-gray-100"}`}
            >
              {s.title}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Editor */}
      <main className="flex-1 flex flex-col space-y-4">
        {/* Sticky top progress bar */}
        <div className="sticky top-0 bg-white py-2 z-10 border-b">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Business Plan Editor</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">Mode:</span>
                <button
                  onClick={() => setPersona(persona === "newbie" ? "expert" : "newbie")}
                  className={`px-3 py-1 text-sm rounded ${
                    persona === "newbie" 
                      ? "bg-blue-100 text-blue-800" 
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {persona === "newbie" ? "Newbie" : "Expert"}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAIChat(!showAIChat)}
                  className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded"
                >
                  {showAIChat ? "Hide AI" : "AI Chat"}
                </button>

                <button
                  onClick={() => setShowInfoDrawer(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                >
                  <span>ℹ️</span> How it works
                </button>
              </div>
              <span className="text-xs text-gray-500">
                {saved ? "✅ Saved" : "Saving..."}
              </span>
            </div>
          </div>
          <div className="mt-2"><Progress value={content.length > 0 ? 30 : 10} /></div>
        </div>

        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setSaved(false);
          }}
          placeholder="Start writing your plan..."
          className="w-full h-64 p-4 border rounded-md"
        />

        {/* Navigation */}
        <div className="flex justify-between mt-4">
          <Button variant="outline" asChild>
            <Link href={program ? "/results" : "/reco"}>⬅ Back</Link>
          </Button>
          <Button asChild>
            <Link href="/preview">Continue to Preview ➡</Link>
          </Button>
        </div>
      </main>

      {/* Right Sidebar */}
      <aside className="w-80 space-y-4 sticky top-6 h-fit hidden lg:block">
        {/* AI Chat */}
        {showAIChat && (
          <div className="h-96">
            <AIChat
              onInsertContent={(content) => {
                setContent(prev => prev + "\n\n" + content);
                setSaved(false);
              }}
              currentSection={sections[activeIdx]?.title || "Current Section"}
              persona={persona}
            />
          </div>
        )}

        {/* Plan Coach */}
        <PlanCoach
          onInsertContent={(content) => {
            setContent(prev => prev + "\n\n" + content);
            setSaved(false);
          }}
          currentSection={sections[activeIdx]?.title || "Current Section"}
          persona={persona}
        />

        {/* Snapshot Manager */}
        <SnapshotManager
          onRestore={(snapshot) => {
            setContent(snapshot.content);
            setSections(snapshot.sections);
            setSaved(false);
          }}
          currentContent={content}
          currentSections={sections}
        />

        {/* Hints & Helpers */}
        <div className="bg-gray-50 border rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Hints</h2>
          {persona === "newbie" && (
            <div>
              <p className="text-sm text-gray-700">{chapterTemplates[activeIdx]?.hint}</p>
              {chapterTemplates[activeIdx]?.subchapters && (
                <div className="mt-3">
                  <h4 className="text-sm font-semibold mb-2">Subchapters:</h4>
                  <div className="space-y-1">
                    {chapterTemplates[activeIdx].subchapters!.map((sub, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <input 
                          type="checkbox" 
                          checked={sub.completed}
                          onChange={() => {
                            // Toggle completion (stub - would update state)
                            console.log(`Toggle ${sub.id}`);
                          }}
                          className="rounded"
                        />
                        <span className={sub.completed ? "line-through text-gray-500" : ""}>
                          {sub.title}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Completion: {chapterTemplates[activeIdx].subchapters!.filter(s => s.completed).length} / {chapterTemplates[activeIdx].subchapters!.length}
                  </div>
                </div>
              )}
            </div>
          )}
          {persona === "expert" && (
            <p className="text-sm text-gray-500 italic">Expert mode: Hints hidden for clean editing</p>
          )}
          
          {persona === "newbie" && (
            <>
              <div className="border-t pt-3">
                <h3 className="font-semibold text-sm">TAM/SAM/SOM</h3>
                <p className="text-xs text-gray-600">Stub: Estimate market sizes to strengthen your market chapter.</p>
              </div>
              <div className="border-t pt-3">
                <h3 className="font-semibold text-sm">Depreciation Helper</h3>
                <p className="text-xs text-gray-600">Stub: Straight-line over N years.</p>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Info Drawer */}
      <InfoDrawer
        isOpen={showInfoDrawer}
        onClose={() => setShowInfoDrawer(false)}
        title="How the Editor Helps"
        content={
          <div className="space-y-4">
            <p>
              Our business plan editor adapts to your experience level and provides 
              intelligent guidance throughout the writing process.
            </p>
            
            <h3 className="font-semibold">Editor Modes:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Newbie Mode:</strong> Shows hints, examples, and tooltips to guide you through each section</li>
              <li><strong>Expert Mode:</strong> Clean interface with minimal distractions for experienced writers</li>
            </ul>

            <h3 className="font-semibold">Plan Types:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Strategy (4-8 pages):</strong> Concise template for quick planning and pitch decks</li>
              <li><strong>Upgrade & Review:</strong> Upload existing plans for professional enhancement</li>
              <li><strong>Custom (15-35 pages):</strong> Full template with subchapters and detailed guidance</li>
            </ul>

            <h3 className="font-semibold">Features:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Auto-save to prevent data loss</li>
              <li>Professor tips and "what good looks like" guidance</li>
              <li>Built-in calculators (TAM/SAM/SOM, Depreciation)</li>
              <li>Version snapshots for tracking progress</li>
            </ul>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              <strong>Copy Protection:</strong> Preview mode includes watermarks and copy restrictions. 
              Full access requires purchase. Note: Web-based protection has limitations.
            </div>
          </div>
        }
      />
    </div>
  );
}
