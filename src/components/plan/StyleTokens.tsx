import React, { useState } from "react";
import { Tooltip } from "@/components/common/Tooltip";
import { HelpCircle } from "lucide-react";

type StyleTokensProps = {
  onStyleChange: (styles: DocumentStyles) => void;
  initialStyles?: DocumentStyles;
};

export type DocumentStyles = {
  h1: {
    fontSize: string;
    fontWeight: string;
    color: string;
    marginBottom: string;
  };
  h2: {
    fontSize: string;
    fontWeight: string;
    color: string;
    marginBottom: string;
  };
  body: {
    fontSize: string;
    lineHeight: string;
    color: string;
    fontFamily: string;
  };
  quote: {
    fontSize: string;
    fontStyle: string;
    color: string;
    borderLeft: string;
    paddingLeft: string;
    backgroundColor: string;
  };
};

const defaultStyles: DocumentStyles = {
  h1: {
    fontSize: "2rem",
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: "1rem"
  },
  h2: {
    fontSize: "1.5rem",
    fontWeight: "semibold",
    color: "#374151",
    marginBottom: "0.75rem"
  },
  body: {
    fontSize: "1rem",
    lineHeight: "1.6",
    color: "#374151",
    fontFamily: "system-ui, sans-serif"
  },
  quote: {
    fontSize: "1rem",
    fontStyle: "italic",
    color: "#6b7280",
    borderLeft: "4px solid #e5e7eb",
    paddingLeft: "1rem",
    backgroundColor: "#f9fafb"
  }
};

export default function StyleTokens({ onStyleChange, initialStyles }: StyleTokensProps) {
  const [styles, setStyles] = useState<DocumentStyles>(initialStyles || defaultStyles);
  const [activeElement, setActiveElement] = useState<keyof DocumentStyles>("body");

  const handleStyleChange = (element: keyof DocumentStyles, property: string, value: string) => {
    const newStyles = {
      ...styles,
      [element]: {
        ...styles[element],
        [property]: value
      }
    };
    setStyles(newStyles);
    onStyleChange(newStyles);
  };

  const stylePresets = [
    {
      name: "Professional",
      styles: {
        h1: { fontSize: "2rem", fontWeight: "bold", color: "#1f2937", marginBottom: "1rem" },
        h2: { fontSize: "1.5rem", fontWeight: "semibold", color: "#374151", marginBottom: "0.75rem" },
        body: { fontSize: "1rem", lineHeight: "1.6", color: "#374151", fontFamily: "system-ui, sans-serif" },
        quote: { fontSize: "1rem", fontStyle: "italic", color: "#6b7280", borderLeft: "4px solid #e5e7eb", paddingLeft: "1rem", backgroundColor: "#f9fafb" }
      }
    },
    {
      name: "Modern",
      styles: {
        h1: { fontSize: "2.25rem", fontWeight: "bold", color: "#111827", marginBottom: "1.25rem" },
        h2: { fontSize: "1.75rem", fontWeight: "semibold", color: "#1f2937", marginBottom: "1rem" },
        body: { fontSize: "1.125rem", lineHeight: "1.7", color: "#374151", fontFamily: "Inter, sans-serif" },
        quote: { fontSize: "1.125rem", fontStyle: "italic", color: "#6b7280", borderLeft: "4px solid #3b82f6", paddingLeft: "1.25rem", backgroundColor: "#eff6ff" }
      }
    },
    {
      name: "Minimal",
      styles: {
        h1: { fontSize: "1.875rem", fontWeight: "normal", color: "#000000", marginBottom: "1rem" },
        h2: { fontSize: "1.5rem", fontWeight: "normal", color: "#000000", marginBottom: "0.75rem" },
        body: { fontSize: "1rem", lineHeight: "1.5", color: "#000000", fontFamily: "Helvetica, sans-serif" },
        quote: { fontSize: "1rem", fontStyle: "normal", color: "#666666", borderLeft: "2px solid #cccccc", paddingLeft: "1rem", backgroundColor: "#ffffff" }
      }
    }
  ];

  const applyPreset = (preset: typeof stylePresets[0]) => {
    setStyles(preset.styles as DocumentStyles);
    onStyleChange(preset.styles as DocumentStyles);
  };

  const currentElement = styles[activeElement];

  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="font-semibold mb-4">Document Styles</h3>
      
      {/* Presets */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <label className="block text-sm font-medium">Style Presets</label>
          <Tooltip content="Choose from pre-designed style combinations for quick setup" position="top">
            <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
          </Tooltip>
        </div>
        <div className="flex gap-2">
          {stylePresets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="px-3 py-1 text-xs border rounded hover:bg-gray-50"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Element Selector */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <label className="block text-sm font-medium">Style Element</label>
          <Tooltip content="Select which document element to customize (headings, body text, quotes)" position="top">
            <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
          </Tooltip>
        </div>
        <div className="flex gap-2">
          {Object.keys(styles).map((element) => (
            <button
              key={element}
              onClick={() => setActiveElement(element as keyof DocumentStyles)}
              className={`px-3 py-1 text-xs border rounded ${
                activeElement === element ? "bg-blue-100 border-blue-300" : "hover:bg-gray-50"
              }`}
            >
              {element.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Style Controls */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Font Size</label>
          <input
            type="range"
            min="0.75"
            max="3"
            step="0.25"
            value={parseFloat(currentElement.fontSize) / 16}
            onChange={(e) => handleStyleChange(activeElement, "fontSize", `${parseFloat(e.target.value)}rem`)}
            className="w-full"
          />
          <div className="text-xs text-gray-500">{currentElement.fontSize}</div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Font Weight</label>
          <select
            value={(currentElement as any).fontWeight || "normal"}
            onChange={(e) => handleStyleChange(activeElement, "fontWeight", e.target.value)}
            className="w-full border rounded p-1 text-sm"
          >
            <option value="normal">Normal</option>
            <option value="medium">Medium</option>
            <option value="semibold">Semibold</option>
            <option value="bold">Bold</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Color</label>
          <input
            type="color"
            value={currentElement.color}
            onChange={(e) => handleStyleChange(activeElement, "color", e.target.value)}
            className="w-full h-8 border rounded"
          />
        </div>

        {activeElement === "body" && (
          <div>
            <label className="block text-sm font-medium mb-1">Line Height</label>
            <input
              type="range"
              min="1"
              max="2"
              step="0.1"
              value={parseFloat((currentElement as any).lineHeight || "1.6")}
              onChange={(e) => handleStyleChange(activeElement, "lineHeight", e.target.value)}
              className="w-full"
            />
            <div className="text-xs text-gray-500">{(currentElement as any).lineHeight || "1.6"}</div>
          </div>
        )}

        {activeElement === "quote" && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Border Left</label>
              <input
                type="text"
                value={(currentElement as any).borderLeft || ""}
                onChange={(e) => handleStyleChange(activeElement, "borderLeft", e.target.value)}
                className="w-full border rounded p-1 text-sm"
                placeholder="4px solid #e5e7eb"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Background Color</label>
              <input
                type="color"
                value={(currentElement as any).backgroundColor || "#f9fafb"}
                onChange={(e) => handleStyleChange(activeElement, "backgroundColor", e.target.value)}
                className="w-full h-8 border rounded"
              />
            </div>
          </>
        )}
      </div>

      {/* Preview */}
      <div className="mt-6 border-t pt-4">
        <h4 className="font-medium mb-3">Preview</h4>
        <div className="border rounded p-4 bg-gray-50">
          <div style={styles.h1}>Heading 1 Example</div>
          <div style={styles.h2}>Heading 2 Example</div>
          <div style={styles.body}>
            This is a sample body text to show how the styling will look in your document. 
            It includes multiple lines to demonstrate the line height and overall appearance.
          </div>
          <div style={styles.quote}>
            "This is a sample quote to demonstrate the quote styling."
          </div>
        </div>
      </div>
    </div>
  );
}
