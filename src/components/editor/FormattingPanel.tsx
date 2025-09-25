/**
 * Formatting Panel Component
 * Controls document formatting, themes, and layout options
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface FormattingOptions {
  pageSize: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
  theme: 'serif' | 'sans' | 'modern' | 'classic';
  spacing: 'compact' | 'normal' | 'relaxed';
  headingNumbering: boolean;
  pageBreaks: boolean;
  showPageNumbers: boolean;
  showTableOfContents: boolean;
  showListOfFigures: boolean;
  fontSize: 'small' | 'medium' | 'large';
  lineHeight: 'tight' | 'normal' | 'loose';
  // New options
  tone: 'formal' | 'neutral' | 'concise' | 'persuasive';
  language: 'en' | 'de' | 'fr' | 'es';
  pageCount: 'auto' | '1-5' | '5-10' | '10-20' | '20+';
  citations: 'none' | 'minimal' | 'standard' | 'academic';
  watermark: boolean;
  customWatermark?: string;
}

interface FormattingPanelProps {
  options: FormattingOptions;
  onOptionsChange: (options: FormattingOptions) => void;
  onApply: () => void;
}

const PAGE_SIZES = [
  { value: 'A4', label: 'A4 (210 × 297 mm)', description: 'European standard' },
  { value: 'Letter', label: 'Letter (8.5 × 11 in)', description: 'US standard' }
];

const THEMES = [
  { value: 'serif', label: 'Serif', description: 'Times New Roman, traditional' },
  { value: 'sans', label: 'Sans Serif', description: 'Arial, modern' },
  { value: 'modern', label: 'Modern', description: 'Helvetica, clean' },
  { value: 'classic', label: 'Classic', description: 'Georgia, academic' }
];

const SPACING_OPTIONS = [
  { value: 'compact', label: 'Compact', description: 'Tight spacing, more content' },
  { value: 'normal', label: 'Normal', description: 'Standard spacing' },
  { value: 'relaxed', label: 'Relaxed', description: 'Wide spacing, easy reading' }
];

const FONT_SIZES = [
  { value: 'small', label: 'Small (10pt)', description: 'More content per page' },
  { value: 'medium', label: 'Medium (12pt)', description: 'Standard size' },
  { value: 'large', label: 'Large (14pt)', description: 'Easy to read' }
];

const LINE_HEIGHTS = [
  { value: 'tight', label: 'Tight (1.2)', description: 'Compact lines' },
  { value: 'normal', label: 'Normal (1.5)', description: 'Standard spacing' },
  { value: 'loose', label: 'Loose (1.8)', description: 'Wide line spacing' }
];

const TONE_OPTIONS = [
  { value: 'formal', label: 'Formal', description: 'Professional, academic tone' },
  { value: 'neutral', label: 'Neutral', description: 'Balanced, objective tone' },
  { value: 'concise', label: 'Concise', description: 'Brief, to-the-point' },
  { value: 'persuasive', label: 'Persuasive', description: 'Compelling, convincing' }
];

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
  { value: 'es', label: 'Español', flag: '🇪🇸' }
];

const PAGE_COUNT_OPTIONS = [
  { value: 'auto', label: 'Auto', description: 'Let AI determine length' },
  { value: '1-5', label: '1-5 pages', description: 'Brief summary' },
  { value: '5-10', label: '5-10 pages', description: 'Standard length' },
  { value: '10-20', label: '10-20 pages', description: 'Detailed plan' },
  { value: '20+', label: '20+ pages', description: 'Comprehensive document' }
];

const CITATION_OPTIONS = [
  { value: 'none', label: 'None', description: 'No citations' },
  { value: 'minimal', label: 'Minimal', description: 'Key sources only' },
  { value: 'standard', label: 'Standard', description: 'Standard references' },
  { value: 'academic', label: 'Academic', description: 'Full academic citations' }
];

export default function FormattingPanel({ 
  options, 
  onOptionsChange, 
  onApply 
}: FormattingPanelProps) {
  const [localOptions, setLocalOptions] = useState<FormattingOptions>(options);

  const handleOptionChange = (key: keyof FormattingOptions, value: any) => {
    const newOptions = { ...localOptions, [key]: value };
    setLocalOptions(newOptions);
    onOptionsChange(newOptions);
  };

  const handleReset = () => {
    const defaultOptions: FormattingOptions = {
      pageSize: 'A4',
      orientation: 'portrait',
      theme: 'sans',
      spacing: 'normal',
      headingNumbering: true,
      pageBreaks: true,
      showPageNumbers: true,
      showTableOfContents: true,
      showListOfFigures: true,
      fontSize: 'medium',
      lineHeight: 'normal',
      tone: 'neutral',
      language: 'en',
      pageCount: 'auto',
      citations: 'standard',
      watermark: false,
      customWatermark: ''
    };
    setLocalOptions(defaultOptions);
    onOptionsChange(defaultOptions);
  };

  const getThemeClasses = (theme: string) => {
    switch (theme) {
      case 'serif':
        return 'font-serif';
      case 'sans':
        return 'font-sans';
      case 'modern':
        return 'font-sans font-light';
      case 'classic':
        return 'font-serif font-medium';
      default:
        return 'font-sans';
    }
  };

  const getSpacingClasses = (spacing: string) => {
    switch (spacing) {
      case 'compact':
        return 'space-y-2';
      case 'normal':
        return 'space-y-4';
      case 'relaxed':
        return 'space-y-6';
      default:
        return 'space-y-4';
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Document Formatting</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <Button size="sm" onClick={onApply}>
              Apply
            </Button>
          </div>
        </div>

        {/* Page Layout */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">Page Layout</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-600 mb-1">Page Size</Label>
              <select 
                value={localOptions.pageSize} 
                onChange={(e) => handleOptionChange('pageSize', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PAGE_SIZES.map(size => (
                  <option key={size.value} value={size.value}>
                    {size.label} - {size.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs text-gray-600 mb-1">Orientation</Label>
              <select 
                value={localOptions.orientation} 
                onChange={(e) => handleOptionChange('orientation', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">Typography</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-600 mb-1">Theme</Label>
              <select 
                value={localOptions.theme} 
                onChange={(e) => handleOptionChange('theme', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {THEMES.map(theme => (
                  <option key={theme.value} value={theme.value}>
                    {theme.label} - {theme.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs text-gray-600 mb-1">Font Size</Label>
              <select 
                value={localOptions.fontSize} 
                onChange={(e) => handleOptionChange('fontSize', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {FONT_SIZES.map(size => (
                  <option key={size.value} value={size.value}>
                    {size.label} - {size.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-600 mb-1">Spacing</Label>
              <select 
                value={localOptions.spacing} 
                onChange={(e) => handleOptionChange('spacing', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SPACING_OPTIONS.map(spacing => (
                  <option key={spacing.value} value={spacing.value}>
                    {spacing.label} - {spacing.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs text-gray-600 mb-1">Line Height</Label>
              <select 
                value={localOptions.lineHeight} 
                onChange={(e) => handleOptionChange('lineHeight', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {LINE_HEIGHTS.map(height => (
                  <option key={height.value} value={height.value}>
                    {height.label} - {height.description}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Document Features */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">Document Features</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Heading Numbering</Label>
                <p className="text-xs text-gray-500">Auto-number headings (1.1, 1.2, etc.)</p>
              </div>
              <Switch
                checked={localOptions.headingNumbering}
                onCheckedChange={(checked) => handleOptionChange('headingNumbering', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Page Breaks</Label>
                <p className="text-xs text-gray-500">Insert page breaks between sections</p>
              </div>
              <Switch
                checked={localOptions.pageBreaks}
                onCheckedChange={(checked) => handleOptionChange('pageBreaks', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Page Numbers</Label>
                <p className="text-xs text-gray-500">Show page numbers in footer</p>
              </div>
              <Switch
                checked={localOptions.showPageNumbers}
                onCheckedChange={(checked) => handleOptionChange('showPageNumbers', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Table of Contents</Label>
                <p className="text-xs text-gray-500">Auto-generate from headings</p>
              </div>
              <Switch
                checked={localOptions.showTableOfContents}
                onCheckedChange={(checked) => handleOptionChange('showTableOfContents', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">List of Figures</Label>
                <p className="text-xs text-gray-500">Auto-generate from image captions</p>
              </div>
              <Switch
                checked={localOptions.showListOfFigures}
                onCheckedChange={(checked) => handleOptionChange('showListOfFigures', checked)}
              />
            </div>
          </div>
        </div>

        {/* Content Customization */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">Content Customization</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-600 mb-1">Tone</Label>
              <select 
                value={localOptions.tone} 
                onChange={(e) => handleOptionChange('tone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TONE_OPTIONS.map(tone => (
                  <option key={tone.value} value={tone.value}>
                    {tone.label} - {tone.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs text-gray-600 mb-1">Language</Label>
              <select 
                value={localOptions.language} 
                onChange={(e) => handleOptionChange('language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {LANGUAGE_OPTIONS.map(lang => (
                  <option key={lang.value} value={lang.value}>
                    {lang.flag} {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-600 mb-1">Page Count</Label>
              <select 
                value={localOptions.pageCount} 
                onChange={(e) => handleOptionChange('pageCount', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PAGE_COUNT_OPTIONS.map(count => (
                  <option key={count.value} value={count.value}>
                    {count.label} - {count.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs text-gray-600 mb-1">Citations</Label>
              <select 
                value={localOptions.citations} 
                onChange={(e) => handleOptionChange('citations', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CITATION_OPTIONS.map(citation => (
                  <option key={citation.value} value={citation.value}>
                    {citation.label} - {citation.description}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Watermark Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">Watermark & Branding</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Watermark</Label>
                <p className="text-xs text-gray-500">Add watermark to document</p>
              </div>
              <Switch
                checked={localOptions.watermark}
                onCheckedChange={(checked) => handleOptionChange('watermark', checked)}
              />
            </div>

            {localOptions.watermark && (
              <div>
                <Label className="text-xs text-gray-600 mb-1">Custom Watermark Text</Label>
                <input
                  type="text"
                  value={localOptions.customWatermark || ''}
                  onChange={(e) => handleOptionChange('customWatermark', e.target.value)}
                  placeholder="Enter custom watermark text..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">Preview</h4>
          <div className={`p-4 border rounded-lg bg-white ${getThemeClasses(localOptions.theme)} ${getSpacingClasses(localOptions.spacing)}`}>
            <h1 className="text-xl font-bold mb-2">Sample Heading</h1>
            <p className="text-sm mb-2">
              This is a sample paragraph showing how your document will look with the current formatting settings. 
              The text uses the selected theme and spacing options.
            </p>
            <h2 className="text-lg font-semibold mb-2">Subheading</h2>
            <p className="text-sm">
              Another paragraph to demonstrate the line height and overall appearance of your document.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
