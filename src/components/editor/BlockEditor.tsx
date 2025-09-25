/**
 * Block Editor Component
 * Integrates all block types and formatting options
 */

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import TextBlock from './blocks/TextBlock';
import TableBlock from './blocks/TableBlock';
import ToCBlock from './blocks/ToCBlock';
import ImageBlock from './blocks/ImageBlock';
import QuoteBlock from './blocks/QuoteBlock';
import ChartBlock from './blocks/ChartBlock';
import KPIChip from './blocks/KPIChip';
import CitationBlock from './blocks/CitationBlock';
import FormattingPanel from './FormattingPanel';

export interface Block {
  id: string;
  type: 'text' | 'table' | 'toc' | 'image' | 'quote' | 'chart' | 'kpi' | 'citation';
  data: any;
  order: number;
}

export interface FormattingOptions {
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
}

interface BlockEditorProps {
  initialBlocks?: Block[];
  onBlocksChange?: (blocks: Block[]) => void;
  onSave?: (blocks: Block[]) => void;
  onExport?: (format: 'pdf' | 'docx' | 'json') => void;
  showFormatting?: boolean;
  showToolbar?: boolean;
}

const BLOCK_TYPES = [
  { value: 'text', label: 'Text Block', icon: '📝' },
  { value: 'table', label: 'Table', icon: '📊' },
  { value: 'toc', label: 'Table of Contents', icon: '📑' },
  { value: 'image', label: 'Image', icon: '🖼️' },
  { value: 'quote', label: 'Quote', icon: '💬' },
  { value: 'chart', label: 'Chart', icon: '📈' },
  { value: 'kpi', label: 'KPI Chips', icon: '📊' },
  { value: 'citation', label: 'Citations', icon: '📚' }
];

export default function BlockEditor({
  initialBlocks = [],
  onBlocksChange,
  onSave,
  onExport,
  showFormatting = true,
  showToolbar = true
}: BlockEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [showFormattingPanel, setShowFormattingPanel] = useState(false);
  const [formattingOptions, setFormattingOptions] = useState<FormattingOptions>({
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
    lineHeight: 'normal'
  });

  const addBlock = useCallback((type: string) => {
    const newBlock: Block = {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type as any,
      data: getDefaultDataForType(type),
      order: blocks.length
    };

    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);
    onBlocksChange?.(newBlocks);
    setSelectedBlock(newBlock.id);
  }, [blocks, onBlocksChange]);

  const updateBlock = useCallback((blockId: string, data: any) => {
    const newBlocks = blocks.map(block =>
      block.id === blockId ? { ...block, data } : block
    );
    setBlocks(newBlocks);
    onBlocksChange?.(newBlocks);
  }, [blocks, onBlocksChange]);

  const removeBlock = useCallback((blockId: string) => {
    const newBlocks = blocks.filter(block => block.id !== blockId);
    setBlocks(newBlocks);
    onBlocksChange?.(newBlocks);
    if (selectedBlock === blockId) {
      setSelectedBlock(null);
    }
  }, [blocks, onBlocksChange, selectedBlock]);

  const moveBlock = useCallback((blockId: string, direction: 'up' | 'down') => {
    const index = blocks.findIndex(block => block.id === blockId);
    if (index === -1) return;

    const newBlocks = [...blocks];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < blocks.length) {
      [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
      newBlocks.forEach((block, i) => {
        block.order = i;
      });
      setBlocks(newBlocks);
      onBlocksChange?.(newBlocks);
    }
  }, [blocks, onBlocksChange]);

  const getDefaultDataForType = (type: string): any => {
    switch (type) {
      case 'text':
        return { content: '', title: 'Text Block' };
      case 'table':
        return { 
          data: [['Column 1', 'Column 2', 'Column 3']], 
          columns: ['Column 1', 'Column 2', 'Column 3'],
          title: 'Data Table'
        };
      case 'toc':
        return { content: '', title: 'Table of Contents' };
      case 'image':
        return { src: '', alt: '', caption: '', title: 'Image' };
      case 'quote':
        return { 
          text: '', 
          author: '', 
          company: '', 
          type: 'testimonial',
          title: 'Quote'
        };
      case 'chart':
        return { 
          data: [], 
          columns: [], 
          title: 'Chart',
          chartType: 'bar'
        };
      case 'kpi':
        return { data: [], title: 'Key Metrics' };
      case 'citation':
        return { data: [], title: 'References' };
      default:
        return {};
    }
  };

  const renderBlock = (block: Block) => {
    const commonProps = {
      key: block.id,
      data: block.data,
      onEdit: (data: any) => updateBlock(block.id, data)
    };

    switch (block.type) {
      case 'text':
        return <TextBlock {...commonProps} />;
      case 'table':
        return <TableBlock {...commonProps} columns={block.data.columns || []} />;
      case 'toc':
        return <ToCBlock {...commonProps} />;
      case 'image':
        return <ImageBlock {...commonProps} />;
      case 'quote':
        return <QuoteBlock {...commonProps} />;
      case 'chart':
        return <ChartBlock {...commonProps} />;
      case 'kpi':
        return <KPIChip {...commonProps} />;
      case 'citation':
        return <CitationBlock {...commonProps} />;
      default:
        return null;
    }
  };

  const handleSave = () => {
    onSave?.(blocks);
  };

  const handleExport = (format: 'pdf' | 'docx' | 'json') => {
    onExport?.(format);
  };

  const handleFormattingChange = (options: FormattingOptions) => {
    setFormattingOptions(options);
  };

  const handleFormattingApply = () => {
    setShowFormattingPanel(false);
    // Apply formatting to all blocks
    // This would update the visual appearance of blocks
  };

  const handlePasteText = () => {
    const text = prompt("Paste your existing text here:");
    if (text && text.trim()) {
      // Create a new text block with the pasted content
      const newBlock: Block = {
        id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'text',
        data: { content: text.trim() },
        order: blocks.length
      };
      
      const newBlocks = [...blocks, newBlock];
      setBlocks(newBlocks);
      onBlocksChange?.(newBlocks);
      setSelectedBlock(newBlock.id);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        {showToolbar && (
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <select 
                  onChange={(e) => addBlock(e.target.value)}
                  className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue=""
                >
                  <option value="" disabled>Add Block</option>
                  {BLOCK_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
                
                <Button
                  variant="outline"
                  onClick={handlePasteText}
                >
                  📋 Paste existing text
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setShowFormattingPanel(!showFormattingPanel)}
                >
                  🎨 Formatting
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleSave}>
                  💾 Save
                </Button>
                <select 
                  onChange={(e) => handleExport(e.target.value as 'pdf' | 'docx' | 'json')}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue=""
                >
                  <option value="" disabled>Export</option>
                  <option value="pdf">PDF</option>
                  <option value="docx">DOCX</option>
                  <option value="json">JSON</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Editor Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {blocks.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  Start Building Your Document
                </h3>
                <p className="text-gray-500 mb-4">
                  Add blocks to create your business plan
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <select 
                    onChange={(e) => addBlock(e.target.value)}
                    className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue=""
                  >
                    <option value="" disabled>Add First Block</option>
                    {BLOCK_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    onClick={handlePasteText}
                    className="w-48"
                  >
                    📋 Paste existing text
                  </Button>
                </div>
              </div>
            ) : (
              blocks.map((block, index) => (
                <div
                  key={block.id}
                  className={`relative group ${selectedBlock === block.id ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => setSelectedBlock(block.id)}
                >
                  {/* Block Controls */}
                  <div className="absolute -left-12 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex flex-col gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveBlock(block.id, 'up');
                        }}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveBlock(block.id, 'down');
                        }}
                        disabled={index === blocks.length - 1}
                      >
                        ↓
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeBlock(block.id);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        ×
                      </Button>
                    </div>
                  </div>

                  {/* Block Content */}
                  {renderBlock(block)}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Formatting Panel */}
      {showFormatting && showFormattingPanel && (
        <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          <FormattingPanel
            options={formattingOptions}
            onOptionsChange={handleFormattingChange}
            onApply={handleFormattingApply}
          />
        </div>
      )}
    </div>
  );
}
