// ========= PLAN2FUND — RICH TEXT EDITOR =========
// Rich text editor component for section content editing

import React, { useState, useRef, useEffect } from 'react';
import { PlanSection } from '@/types/plan';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  section: PlanSection;
  guidance?: string;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  showWordCount?: boolean;
  showGuidance?: boolean;
}

export default function RichTextEditor({
  content,
  onChange,
  section,
  guidance,
  placeholder,
  minLength = 50,
  maxLength = 5000,
  showWordCount = true,
  showGuidance = true
}: RichTextEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Calculate word and character count
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    setCharCount(content.length);
  }, [content]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    onChange(newContent);
  };

  const getStatusColor = () => {
    if (charCount < minLength) return 'text-red-500';
    if (charCount > maxLength * 0.9) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStatusText = () => {
    if (charCount < minLength) return `Need ${minLength - charCount} more characters`;
    if (charCount > maxLength * 0.9) return `${maxLength - charCount} characters remaining`;
    return 'Good length';
  };

  return (
    <div className="rich-text-editor space-y-3">
      {/* Editor Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-900">{section.title}</h4>
        <div className="flex items-center space-x-2">
          {showWordCount && (
            <div className="text-sm text-gray-500">
              {wordCount} words • {charCount} chars
            </div>
          )}
          <div className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </div>
        </div>
      </div>

      {/* Guidance */}
      {showGuidance && guidance && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800">
                {guidance}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Text Editor */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder || `Enter content for ${section.title}...`}
          className={`w-full p-4 border rounded-lg resize-none transition-all duration-200 ${
            isFocused 
              ? 'border-blue-500 ring-2 ring-blue-200' 
              : 'border-gray-300 hover:border-gray-400'
          } ${
            charCount < minLength ? 'border-red-300 bg-red-50' : ''
          } ${
            charCount > maxLength * 0.9 ? 'border-yellow-300 bg-yellow-50' : ''
          }`}
          style={{ minHeight: '200px' }}
        />
        
        {/* Character count indicator */}
        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
          {charCount}/{maxLength}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => {
              const newContent = content + '\n\n• ';
              onChange(newContent);
            }}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            + Add bullet point
          </button>
          <button
            type="button"
            onClick={() => {
              const newContent = content + '\n\n## ';
              onChange(newContent);
            }}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            + Add subheading
          </button>
        </div>
        
        <div className="text-xs text-gray-500">
          {charCount < minLength && (
            <span className="text-red-500">
              Minimum {minLength} characters required
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
