import { useState, useEffect } from "react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";

const chapters = [
  "Executive Summary",
  "Products & Services",
  "Company & Management",
  "Industry",
  "Market & Competition",
  "Marketing & Sales",
  "Financial Planning & Forecasting",
  "Attachments",
];

export default function Editor() {
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState(true);

  // Autosave simulation
  useEffect(() => {
    if (!saved) {
      const timer = setTimeout(() => setSaved(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [content, saved]);

  return (
    <div className="flex gap-6 p-6">
      {/* Side Navigation */}
      <aside className="w-64 hidden md:block">
        <nav className="space-y-2">
          {chapters.map((ch, i) => (
            <div key={i} className="text-sm py-1 px-2 rounded hover:bg-gray-100 cursor-pointer">
              {ch}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Editor */}
      <main className="flex-1 flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Business Plan Editor</h1>
          <span className="text-xs text-gray-500">
            {saved ? "✓ Saved" : "Saving..."}
          </span>
        </div>

        {/* Progress Bar */}
        <Progress value={content.length > 0 ? 30 : 10} className="h-2" />

        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setSaved(false);
          }}
          placeholder="Start writing your plan..."
          className="w-full h-64 p-4 border rounded-md"
        />

        <div className="flex justify-end mt-4">
          <Link
            href="/review"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Continue to Review →
          </Link>
        </div>
      </main>
    </div>
  );
}
