import React from "react";
import { chapterTemplates } from "@/lib/templates/chapters";

type TableOfContentsProps = {
  sections: Array<{ id: string; title: string; content: string }>;
  onNavigate: (sectionId: string) => void;
};

export default function TableOfContents({ sections, onNavigate }: TableOfContentsProps) {
  const generateTOC = () => {
    const toc: Array<{
      level: number;
      title: string;
      id: string;
      page: number;
      hasSubchapters?: boolean;
      completed?: boolean;
    }> = [];
    
    // Add main sections
    sections.forEach((section, index) => {
      const chapterTemplate = chapterTemplates.find(t => t.id === section.id);
      
      toc.push({
        level: 1,
        title: section.title,
        id: section.id,
        page: index + 2, // Assuming title page is page 1
        hasSubchapters: !!chapterTemplate?.subchapters
      });

      // Add subchapters if they exist
      if (chapterTemplate?.subchapters) {
        chapterTemplate.subchapters.forEach((subchapter) => {
          toc.push({
            level: 2,
            title: subchapter.title,
            id: `${section.id}-${subchapter.id}`,
            page: index + 2, // Same page as main section
            completed: subchapter.completed
          });
        });
      }
    });

    return toc;
  };

  const toc = generateTOC();

  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="font-semibold mb-4">Table of Contents</h3>
      
      <div className="space-y-1 text-sm">
        {toc.map((item, index) => (
          <div
            key={index}
            className={`flex items-center justify-between cursor-pointer hover:bg-gray-50 p-1 rounded ${
              item.level === 1 ? "font-medium" : "ml-4 text-gray-600"
            }`}
            onClick={() => onNavigate(item.id)}
          >
            <div className="flex items-center gap-2">
              {item.level === 2 && <span className="text-gray-400">•</span>}
              <span className={item.completed ? "line-through text-gray-500" : ""}>
                {item.title}
              </span>
              {item.completed && <span className="text-green-500 text-xs">✓</span>}
            </div>
            <span className="text-gray-400 text-xs">
              {item.page}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t text-xs text-gray-500">
        <p>• Click any item to navigate to that section</p>
        <p>• Subchapters marked with ✓ are completed</p>
        <p>• Page numbers are estimated</p>
      </div>
    </div>
  );
}
