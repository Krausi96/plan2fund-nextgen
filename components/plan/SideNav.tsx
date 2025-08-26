import { useState } from "react";
import { cn } from "@/lib/utils";

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

interface SideNavProps {
  current: number;
  setCurrent: (idx: number) => void;
}

export default function SideNav({ current, setCurrent }: SideNavProps) {
  return (
    <nav className="w-64 bg-gray-50 border-r p-4 space-y-2">
      {chapters.map((c, idx) => (
        <button
          key={c}
          onClick={() => setCurrent(idx)}
          className={cn(
            "block w-full text-left px-3 py-2 rounded-md hover:bg-gray-100",
            current === idx ? "bg-blue-100 font-semibold text-blue-600" : ""
          )}
        >
          {c}
        </button>
      ))}
    </nav>
  );
}
