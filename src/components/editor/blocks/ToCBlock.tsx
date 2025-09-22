/**
 * ToCBlock component for editor
 * Generates table of contents from document structure
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ToCItem {
  id: string;
  title: string;
  level: number;
  children?: ToCItem[];
}

interface ToCBlockProps {
  content?: string;
  title?: string;
  onEdit?: (toc: ToCItem[]) => void;
}

export default function ToCBlock({ 
  content = '', 
  title = "Table of Contents",
  onEdit 
}: ToCBlockProps) {
  const [toc, setToc] = useState<ToCItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (content) {
      generateTOC(content);
    }
  }, [content]);

  const generateTOC = (text: string) => {
    const lines = text.split('\n');
    const tocItems: ToCItem[] = [];
    let currentId = 0;

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      
      // Match heading patterns (##, ###, ####, etc.)
      const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const title = headingMatch[2];
        const id = `heading-${currentId++}`;
        
        tocItems.push({
          id,
          title,
          level
        });
      }
    });

    // Organize into hierarchy
    const organizedToc = organizeTOC(tocItems);
    setToc(organizedToc);
  };

  const organizeTOC = (items: ToCItem[]): ToCItem[] => {
    const result: ToCItem[] = [];
    const stack: ToCItem[] = [];

    items.forEach(item => {
      // Pop items from stack that are at the same or deeper level
      while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
        stack.pop();
      }

      if (stack.length === 0) {
        // Top level item
        result.push(item);
      } else {
        // Child item
        const parent = stack[stack.length - 1];
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(item);
      }

      stack.push(item);
    });

    return result;
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    if (onEdit) {
      onEdit(toc);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const renderTOCItem = (item: ToCItem, index: number) => {
    const indent = (item.level - 1) * 20;
    
    return (
      <div key={item.id} className="py-1">
        <div 
          className="flex items-center py-1 px-2 hover:bg-gray-100 rounded cursor-pointer"
          style={{ paddingLeft: `${indent}px` }}
        >
          <span className="text-sm text-gray-600 mr-2">
            {index + 1}.
          </span>
          <span className="text-sm text-gray-800">
            {item.title}
          </span>
        </div>
        {item.children && item.children.map((child, childIndex) => 
          renderTOCItem(child, childIndex)
        )}
      </div>
    );
  };

  const renderTOC = () => {
    if (toc.length === 0) {
      return (
        <div className="text-center text-gray-500 py-8">
          <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>No headings found in content</p>
          <p className="text-xs text-gray-400 mt-1">
            Use ##, ###, #### etc. to create headings
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {toc.map((item, index) => renderTOCItem(item, index))}
      </div>
    );
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {onEdit && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button size="sm" onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={handleEdit}>
                Edit
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="border border-gray-200 rounded p-4 bg-gray-50">
        {renderTOC()}
      </div>

      {toc.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          <p>Total headings: {toc.length}</p>
          <p>Max depth: {Math.max(...toc.map(item => item.level))}</p>
        </div>
      )}
    </Card>
  );
}
