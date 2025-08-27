import { useState, useEffect } from 'react';

import { useState, useEffect } from "react";
import SideNav from "./SideNav";
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
  const [current, setCurrent] = useState(0);
  const [content, setContent] = useState<Record<number, string>>({});
  const [autosaveStatus, setAutosaveStatus] = useState("Saved");

  const handleChange = (val: string) => {
    setContent({ ...content, [current]: val });
    setAutosaveStatus("Saving...");
  };

  // Simulate autosave
  useEffect(() => {
    if (autosaveStatus === "Saving...") {
      const timer = setTimeout(() => setAutosaveStatus("Saved"), 800);
      return () => clearTimeout(timer);
    }
  }, [content, autosaveStatus]);

  const completion =
    (Object.keys(content).length / chapters.length) * 100;

  return (
    <div className="flex h-screen">
      <SideNav current={current} setCurrent={setCurrent} />
      <main className="flex-1 p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">{chapters[current]}</h2>
          <span className="text-sm text-gray-500">{autosaveStatus}</span>
        </div>
        <Progress value={completion} className="mb-4" />
        <textarea
          className="w-full h-[60vh] border rounded-md p-3"
          placeholder={`Write your ${chapters[current]} here...`}
          value={content[current] || ""}
          onChange={(e) => handleChange(e.target.value)}
        />
      </main>
    </div>
  );
}


export default function Editor() {
  const [content, setContent] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('plan-editor') || '';
    }
    return '';
  });

  useEffect(() => {
    localStorage.setItem('plan-editor', content);
  }, [content]);

  return (
    <div className="p-4 border rounded-xl">
      <textarea
        className="w-full h-80 border p-3 rounded-lg"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start writing your business plan..."
      />
      <p className="text-xs text-gray-400 mt-2">Autosaved locally</p>
    </div>
  );
}
