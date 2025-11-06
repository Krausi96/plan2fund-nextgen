// ========= PLAN2FUND — ENHANCED RICH TEXT EDITOR =========
// Rich text editor component with advanced formatting options

'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { PlanSection } from '@/shared/types/plan';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import ImageUpload from './ImageUpload';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

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
  showFormatting?: boolean;
  onFormattingChange?: (formatting: FormattingOptions) => void;
  showImageUpload?: boolean;
}

interface FormattingOptions {
  theme: 'serif' | 'sans' | 'modern' | 'classic';
  spacing: 'compact' | 'normal' | 'relaxed';
  fontSize: 'small' | 'medium' | 'large';
  lineHeight: 'tight' | 'normal' | 'loose';
  tone: 'formal' | 'neutral' | 'concise' | 'persuasive';
  language: 'en' | 'de' | 'fr' | 'es';
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
  showGuidance = true,
  showFormatting = false,
  onFormattingChange,
  showImageUpload = true
}: RichTextEditorProps) {
  const [isFocused] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [showFormattingPanel, setShowFormattingPanel] = useState(false);
  const [showImageUploadPanel, setShowImageUploadPanel] = useState(false);
  const quillRef = useRef<any>(null);
  const [formatting, setFormatting] = useState<FormattingOptions>({
    theme: 'sans',
    spacing: 'normal',
    fontSize: 'medium',
    lineHeight: 'normal',
    tone: 'neutral',
    language: 'en'
  });

  // Calculate word and character count (strip HTML tags for accurate count)
  useEffect(() => {
    // Strip HTML tags for accurate text counting
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    const words = textContent.split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    setCharCount(textContent.length);
  }, [content]);

  const handleContentChange = (value: string) => {
    onChange(value);
  };

  // Handle image insertion
  const handleImageInsert = (imageUrl: string, caption?: string, description?: string) => {
    if (!quillRef.current) return;
    
    const quill = quillRef.current.getEditor();
    const range = quill.getSelection(true);
    
    // Insert image with optional caption
    let imageHtml = `<img src="${imageUrl}" alt="${caption || ''}" />`;
    if (caption) {
      imageHtml += `<p class="text-sm text-gray-600 italic mt-2">${caption}</p>`;
    }
    if (description) {
      imageHtml += `<p class="text-xs text-gray-500 mt-1">${description}</p>`;
    }
    
    quill.clipboard.dangerouslyPasteHTML(range.index, imageHtml);
    quill.setSelection(range.index + imageHtml.length);
    setShowImageUploadPanel(false);
  };

  // Quill toolbar configuration
  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: () => {
          setShowImageUploadPanel(!showImageUploadPanel);
        }
      }
    },
  }), [showImageUploadPanel]);
  
  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'script', 'indent',
    'color', 'background', 'align',
    'link', 'image'
  ];

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

  const handleFormattingChange = (key: keyof FormattingOptions, value: any) => {
    const newFormatting = { ...formatting, [key]: value };
    setFormatting(newFormatting);
    onFormattingChange?.(newFormatting);
  };

  const getThemeClasses = () => {
    const themeClasses = {
      serif: 'font-serif',
      sans: 'font-sans',
      modern: 'font-sans font-light',
      classic: 'font-serif font-medium'
    };
    return themeClasses[formatting.theme];
  };


  const getFontSizeClasses = () => {
    const fontSizeClasses = {
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-lg'
    };
    return fontSizeClasses[formatting.fontSize];
  };

  const getLineHeightClasses = () => {
    const lineHeightClasses = {
      tight: 'leading-tight',
      normal: 'leading-normal',
      loose: 'leading-loose'
    };
    return lineHeightClasses[formatting.lineHeight];
  };

  return (
    <div className="rich-text-editor space-y-3">
      {/* Editor Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-900">{section.title}</h4>
        <div className="flex items-center space-x-2">
          {showFormatting && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFormattingPanel(!showFormattingPanel)}
              className="text-xs"
            >
              🎨 Formatting
            </Button>
          )}
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

      {/* Formatting Panel */}
      {showFormatting && showFormattingPanel && (
        <Card className="p-4 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Theme</label>
              <select
                value={formatting.theme}
                onChange={(e) => handleFormattingChange('theme', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="serif">Serif</option>
                <option value="sans">Sans Serif</option>
                <option value="modern">Modern</option>
                <option value="classic">Classic</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Font Size</label>
              <select
                value={formatting.fontSize}
                onChange={(e) => handleFormattingChange('fontSize', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Spacing</label>
              <select
                value={formatting.spacing}
                onChange={(e) => handleFormattingChange('spacing', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="compact">Compact</option>
                <option value="normal">Normal</option>
                <option value="relaxed">Relaxed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Line Height</label>
              <select
                value={formatting.lineHeight}
                onChange={(e) => handleFormattingChange('lineHeight', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="tight">Tight</option>
                <option value="normal">Normal</option>
                <option value="loose">Loose</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tone</label>
              <select
                value={formatting.tone}
                onChange={(e) => handleFormattingChange('tone', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="formal">Formal</option>
                <option value="neutral">Neutral</option>
                <option value="concise">Concise</option>
                <option value="persuasive">Persuasive</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Language</label>
              <select
                value={formatting.language}
                onChange={(e) => handleFormattingChange('language', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="en">🇺🇸 English</option>
                <option value="de">🇩🇪 Deutsch</option>
                <option value="fr">🇫🇷 Français</option>
                <option value="es">🇪🇸 Español</option>
              </select>
            </div>
          </div>
        </Card>
      )}


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

      {/* Rich Text Editor */}
      <div className="relative">
        <div className={`border rounded-lg transition-all duration-200 ${
          isFocused 
            ? 'border-blue-500 ring-2 ring-blue-200' 
            : 'border-gray-300 hover:border-gray-400'
        } ${
          charCount < minLength ? 'border-red-300 bg-red-50' : ''
        } ${
          charCount > maxLength * 0.9 ? 'border-yellow-300 bg-yellow-50' : ''
        }`}>
          <ReactQuill
            ref={quillRef}
            value={content}
            onChange={handleContentChange}
            modules={quillModules}
            formats={quillFormats}
            placeholder={placeholder || `Enter content for ${section.title}...`}
            className={`${getThemeClasses()} ${getFontSizeClasses()} ${getLineHeightClasses()}`}
            style={{ minHeight: '300px' }}
            theme="snow"
          />
        </div>
        
        {/* Image Upload Panel */}
        {showImageUpload && showImageUploadPanel && (
          <div className="mt-4">
            <ImageUpload
              onImageInsert={handleImageInsert}
              sectionId={section.key || section.id}
            />
          </div>
        )}
        
        {/* Character count indicator */}
        <div className="mt-2 text-xs text-gray-400 text-right">
          {charCount}/{maxLength} characters
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-between mt-2">
        <div className="text-xs text-gray-500">
          {charCount < minLength && (
            <span className="text-red-500">
              Minimum {minLength} characters required
            </span>
          )}
          {charCount >= minLength && charCount <= maxLength * 0.9 && (
            <span className="text-green-500">
              Content length is good
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
