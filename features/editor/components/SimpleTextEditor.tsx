// ========= PLAN2FUND — SIMPLE GOOGLE DOCS-STYLE EDITOR =========
// Clean, simple editor - no heavy toolbar, just good looking text editing

'use client';

import React, { useState, useRef } from 'react';

interface SimpleTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function SimpleTextEditor({
  content,
  onChange,
  placeholder
}: SimpleTextEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };


  return (
    <div className="space-y-2">
      {/* Google Docs-style Editor Box */}
      <div 
        className={`
          relative
          bg-white
          rounded-lg
          border
          transition-all
          duration-200
          ${isFocused 
            ? 'border-blue-300 shadow-sm' 
            : 'border-gray-200 hover:border-gray-300'
          }
        `}
        onClick={() => textareaRef.current?.focus()}
      >
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder || `Start writing...`}
          className="
            w-full
            min-h-[200px]
            p-6
            text-base
            leading-relaxed
            text-gray-900
            placeholder-gray-400
            resize-none
            border-0
            outline-none
            bg-transparent
            focus:outline-none
          "
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            lineHeight: '1.6'
          }}
        />
      </div>

    </div>
  );
}

