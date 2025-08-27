import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

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
  const router = useRouter();

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
            <div
              key={i}
              className="text-sm py-1 px-2 rounded hover:bg-gray-100 cursor-pointer"
            >
              {ch}
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
            <span className="text-xs text-gray-500">
              {saved ? "✅ Saved" : "Saving..."}
            </span>
          </div>
          <Progress value={content.length > 0 ? 30 : 10} className="h-2 mt-2" />
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
            <Link href={program ? `/eligibility?program=${program.id}` : "/"}>
              ⬅ Back
            </Link>
          </Button>
          <Button asChild>
            <Link href="/review">Continue to Review ➡</Link>
          </Button>
        </div>
      </main>

      {/* Program Overlay */}
      {program && (
        <aside className="w-72 bg-gray-50 border rounded-lg p-4 space-y-3 sticky top-6 h-fit hidden lg:block">
          <h2 className="text-lg font-semibold">Program Requirements</h2>
          <p className="text-sm text-gray-600">
            {program.name} ({program.type}, {program.region})
          </p>
          <p className="text-sm">
            <strong>Max Funding:</strong> €{program.maxAmount.toLocaleString()}
          </p>
          <div>
            <strong className="text-sm">Requirements:</strong>
            <ul className="list-disc list-inside text-sm text-gray-700">
              {program.requirements.map((req, i) => (
                <li key={i}>{req}</li>
              ))}
            </ul>
          </div>
          <a
            href={program.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline text-sm"
          >
            Official Program Link
          </a>
        </aside>
      )}
    </div>
  );
}
