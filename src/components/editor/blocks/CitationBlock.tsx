/**
 * Citation Block Component
 * Manages references and citations for academic/business documents
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CitationData {
  id: string;
  type: 'academic' | 'web' | 'report' | 'book' | 'interview' | 'data_source';
  title: string;
  authors?: string;
  url?: string;
  publisher?: string;
  year?: string;
  pages?: string;
  doi?: string;
  accessed?: string;
  notes?: string;
}

interface CitationBlockProps {
  data?: CitationData[];
  title?: string;
  onEdit?: (data: CitationData[]) => void;
}

const CITATION_TYPES = [
  { value: 'academic', label: 'Academic Paper', icon: '📚' },
  { value: 'web', label: 'Website', icon: '🌐' },
  { value: 'report', label: 'Report', icon: '📄' },
  { value: 'book', label: 'Book', icon: '📖' },
  { value: 'interview', label: 'Interview', icon: '🎤' },
  { value: 'data_source', label: 'Data Source', icon: '📊' }
];

const CITATION_STYLES = [
  { value: 'apa', label: 'APA' },
  { value: 'mla', label: 'MLA' },
  { value: 'chicago', label: 'Chicago' },
  { value: 'harvard', label: 'Harvard' }
];

export default function CitationBlock({ 
  data = [], 
  title = "References", 
  onEdit 
}: CitationBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<CitationData[]>(data);
  const [newCitation, setNewCitation] = useState<Partial<CitationData>>({
    type: 'web',
    title: '',
    authors: '',
    url: '',
    year: new Date().getFullYear().toString()
  });
  const [citationStyle, setCitationStyle] = useState('apa');

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
    setEditData(data);
    setNewCitation({
      type: 'web',
      title: '',
      authors: '',
      url: '',
      year: new Date().getFullYear().toString()
    });
  };

  const handleAddCitation = () => {
    if (newCitation.title) {
      const citation: CitationData = {
        id: `citation_${Date.now()}`,
        type: newCitation.type || 'web',
        title: newCitation.title,
        authors: newCitation.authors,
        url: newCitation.url,
        publisher: newCitation.publisher,
        year: newCitation.year,
        pages: newCitation.pages,
        doi: newCitation.doi,
        accessed: newCitation.accessed,
        notes: newCitation.notes
      };
      setEditData([...editData, citation]);
      setNewCitation({
        type: 'web',
        title: '',
        authors: '',
        url: '',
        year: new Date().getFullYear().toString()
      });
    }
  };

  const handleRemoveCitation = (id: string) => {
    setEditData(editData.filter(citation => citation.id !== id));
  };

  const handleCitationChange = (id: string, field: keyof CitationData, value: any) => {
    setEditData(editData.map(citation => 
      citation.id === id ? { ...citation, [field]: value } : citation
    ));
  };

  const formatCitation = (citation: CitationData, style: string): string => {
    const type = CITATION_TYPES.find(t => t.value === citation.type);
    const icon = type?.icon || '📄';

    switch (style) {
      case 'apa':
        return formatAPACitation(citation, icon);
      case 'mla':
        return formatMLACitation(citation, icon);
      case 'chicago':
        return formatChicagoCitation(citation, icon);
      case 'harvard':
        return formatHarvardCitation(citation, icon);
      default:
        return formatAPACitation(citation, icon);
    }
  };

  const formatAPACitation = (citation: CitationData, icon: string): string => {
    let formatted = `${icon} `;
    
    if (citation.authors) {
      formatted += `${citation.authors}. `;
    }
    
    formatted += `(${citation.year || 'n.d.'}). `;
    formatted += `*${citation.title}*. `;
    
    if (citation.publisher) {
      formatted += `${citation.publisher}. `;
    }
    
    if (citation.url) {
      formatted += `Retrieved from ${citation.url}`;
    }
    
    if (citation.doi) {
      formatted += ` (DOI: ${citation.doi})`;
    }
    
    return formatted;
  };

  const formatMLACitation = (citation: CitationData, icon: string): string => {
    let formatted = `${icon} `;
    
    if (citation.authors) {
      formatted += `${citation.authors}. `;
    }
    
    formatted += `"${citation.title}." `;
    
    if (citation.publisher) {
      formatted += `${citation.publisher}, `;
    }
    
    if (citation.year) {
      formatted += `${citation.year}. `;
    }
    
    if (citation.url) {
      formatted += `Web. ${citation.accessed || 'Accessed today'}.`;
    }
    
    return formatted;
  };

  const formatChicagoCitation = (citation: CitationData, icon: string): string => {
    let formatted = `${icon} `;
    
    if (citation.authors) {
      formatted += `${citation.authors}. `;
    }
    
    formatted += `"${citation.title}." `;
    
    if (citation.publisher) {
      formatted += `${citation.publisher}, `;
    }
    
    if (citation.year) {
      formatted += `${citation.year}. `;
    }
    
    if (citation.url) {
      formatted += `${citation.url}`;
    }
    
    return formatted;
  };

  const formatHarvardCitation = (citation: CitationData, icon: string): string => {
    let formatted = `${icon} `;
    
    if (citation.authors) {
      formatted += `${citation.authors} `;
    }
    
    if (citation.year) {
      formatted += `(${citation.year}) `;
    }
    
    formatted += `*${citation.title}*. `;
    
    if (citation.publisher) {
      formatted += `${citation.publisher}. `;
    }
    
    if (citation.url) {
      formatted += `Available at: ${citation.url}`;
    }
    
    return formatted;
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

          {/* Citation Style */}
          <div>
            <label className="block text-sm font-medium mb-1">Citation Style</label>
            <select 
              value={citationStyle} 
              onChange={(e) => setCitationStyle(e.target.value as any)}
              className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CITATION_STYLES.map(style => (
                <option key={style.value} value={style.value}>
                  {style.label}
                </option>
              ))}
            </select>
          </div>

          {/* Existing Citations */}
          <div className="space-y-3">
            {editData.map((citation, index) => (
              <div key={citation.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Citation #{index + 1}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveCitation(citation.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Type</label>
                    <select 
                      value={citation.type} 
                      onChange={(e) => handleCitationChange(citation.id, 'type', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {CITATION_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Year</label>
                    <Input
                      value={citation.year || ''}
                      onChange={(e) => handleCitationChange(citation.id, 'year', e.target.value)}
                      placeholder="2024"
                      className="text-sm"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">Title</label>
                    <Input
                      value={citation.title}
                      onChange={(e) => handleCitationChange(citation.id, 'title', e.target.value)}
                      placeholder="Article/Book/Report title"
                      className="text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Authors</label>
                    <Input
                      value={citation.authors || ''}
                      onChange={(e) => handleCitationChange(citation.id, 'authors', e.target.value)}
                      placeholder="Author names"
                      className="text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Publisher/Source</label>
                    <Input
                      value={citation.publisher || ''}
                      onChange={(e) => handleCitationChange(citation.id, 'publisher', e.target.value)}
                      placeholder="Publisher name"
                      className="text-sm"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">URL</label>
                    <Input
                      value={citation.url || ''}
                      onChange={(e) => handleCitationChange(citation.id, 'url', e.target.value)}
                      placeholder="https://example.com"
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add new citation */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Add New Citation</h4>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <select 
                  value={newCitation.type} 
                  onChange={(e) => setNewCitation({...newCitation, type: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CITATION_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
                <Input
                  value={newCitation.year || ''}
                  onChange={(e) => setNewCitation({...newCitation, year: e.target.value})}
                  placeholder="Year"
                  className="text-sm"
                />
              </div>
              
              <Input
                value={newCitation.title || ''}
                onChange={(e) => setNewCitation({...newCitation, title: e.target.value})}
                placeholder="Title"
                className="text-sm"
              />
              
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={newCitation.authors || ''}
                  onChange={(e) => setNewCitation({...newCitation, authors: e.target.value})}
                  placeholder="Authors"
                  className="text-sm"
                />
                <Input
                  value={newCitation.publisher || ''}
                  onChange={(e) => setNewCitation({...newCitation, publisher: e.target.value})}
                  placeholder="Publisher"
                  className="text-sm"
                />
              </div>
              
              <Input
                value={newCitation.url || ''}
                onChange={(e) => setNewCitation({...newCitation, url: e.target.value})}
                placeholder="URL"
                className="text-sm"
              />
              
              <Button size="sm" onClick={handleAddCitation} className="w-full">
                Add Citation
              </Button>
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

      {editData.length > 0 ? (
        <div className="space-y-3">
          {editData.map((citation, index) => (
            <div key={citation.id} className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm">
                <span className="font-medium text-gray-600">[{index + 1}]</span>
                <span className="ml-2">
                  {formatCitation(citation, citationStyle)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📚</div>
          <p>No citations added yet. Click Edit to add references.</p>
        </div>
      )}
    </Card>
  );
}
