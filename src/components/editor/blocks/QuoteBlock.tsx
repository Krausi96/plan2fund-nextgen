/**
 * Quote Block Component
 * Displays testimonials, key statements, and highlighted quotes
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

interface QuoteData {
  text: string;
  author: string;
  title?: string;
  company?: string;
  type: 'testimonial' | 'key_statement' | 'highlight' | 'customer_quote';
}

interface QuoteBlockProps {
  data?: QuoteData;
  title?: string;
  onEdit?: (data: QuoteData) => void;
}

const QUOTE_TYPES = [
  { value: 'testimonial', label: 'Customer Testimonial', icon: '💬' },
  { value: 'key_statement', label: 'Key Statement', icon: '💡' },
  { value: 'highlight', label: 'Highlight', icon: '⭐' },
  { value: 'customer_quote', label: 'Customer Quote', icon: '🗣️' }
];

export default function QuoteBlock({ 
  data, 
  title = "Quote", 
  onEdit 
}: QuoteBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<QuoteData>(
    data || {
      text: '',
      author: '',
      title: '',
      company: '',
      type: 'testimonial'
    }
  );

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    if (onEdit) {
      onEdit(editData);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(data || {
      text: '',
      author: '',
      title: '',
      company: '',
      type: 'testimonial'
    });
  };

  const handleFieldChange = (field: keyof QuoteData, value: string) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getQuoteIcon = (type: string) => {
    const quoteType = QUOTE_TYPES.find(t => t.value === type);
    return quoteType?.icon || '💬';
  };

  const getQuoteStyle = (type: string) => {
    switch (type) {
      case 'testimonial':
        return 'border-l-4 border-blue-500 bg-blue-50';
      case 'key_statement':
        return 'border-l-4 border-green-500 bg-green-50';
      case 'highlight':
        return 'border-l-4 border-yellow-500 bg-yellow-50';
      case 'customer_quote':
        return 'border-l-4 border-purple-500 bg-purple-50';
      default:
        return 'border-l-4 border-gray-500 bg-gray-50';
    }
  };

  if (isEditing) {
    return (
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{title}</h3>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}>Save</Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>Cancel</Button>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Quote Type</label>
              <select
                value={editData.type}
                onChange={(e) => handleFieldChange('type', e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                {QUOTE_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Quote Text</label>
              <Textarea
                value={editData.text}
                onChange={(e) => handleFieldChange('text', e.target.value)}
                placeholder="Enter the quote text..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Author</label>
                <Input
                  value={editData.author}
                  onChange={(e) => handleFieldChange('author', e.target.value)}
                  placeholder="Author name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Title/Position</label>
                <Input
                  value={editData.title || ''}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  placeholder="CEO, Founder, etc."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Company (optional)</label>
              <Input
                value={editData.company || ''}
                onChange={(e) => handleFieldChange('company', e.target.value)}
                placeholder="Company name"
              />
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Button size="sm" variant="outline" onClick={handleEdit}>
          Edit
        </Button>
      </div>

      {editData.text ? (
        <div className={`p-4 rounded-lg ${getQuoteStyle(editData.type)}`}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">{getQuoteIcon(editData.type)}</span>
            <div className="flex-1">
              <blockquote className="text-lg italic mb-3">
                "{editData.text}"
              </blockquote>
              <div className="text-sm text-gray-600">
                <div className="font-medium">
                  {editData.author}
                  {editData.title && `, ${editData.title}`}
                </div>
                {editData.company && (
                  <div className="text-gray-500">{editData.company}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">💬</div>
          <p>No quote added yet. Click Edit to add a quote.</p>
        </div>
      )}
    </Card>
  );
}