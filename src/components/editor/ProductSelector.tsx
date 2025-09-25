/**
 * Product Selector Component
 * Entry point for different document types: Create New, Update, Modeling Document
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/contexts/I18nContext';
import { Badge } from '@/components/ui/badge';

interface ProductSelectorProps {
  onSelect: (type: 'create' | 'update' | 'modeling', data?: any) => void;
  onCancel: () => void;
}

export default function ProductSelector({ onSelect, onCancel }: ProductSelectorProps) {
  const { t } = useI18n();
  const [selectedType, setSelectedType] = useState<'create' | 'update' | 'modeling' | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleCreateNew = () => {
    if (businessName.trim()) {
      onSelect('create', {
        businessName: businessName.trim(),
        businessDescription: businessDescription.trim()
      });
    }
  };

  const handleUpdate = () => {
    if (uploadedFile) {
      onSelect('update', {
        file: uploadedFile,
        businessName: businessName.trim()
      });
    }
  };

  const handleModeling = () => {
    onSelect('modeling', {
      businessName: businessName.trim(),
      businessDescription: businessDescription.trim()
    });
  };

  const productOptions = [
    {
      id: 'create',
      title: 'Create New',
      description: 'Start with a blank business plan template',
      icon: '📝',
      features: ['Customizable sections', 'AI guidance', 'Program-specific templates'],
      color: 'blue'
    },
    {
      id: 'update',
      title: 'Update Existing',
      description: 'Upload and enhance your current business plan',
      icon: '📄',
      features: ['Word/PDF upload', 'Content analysis', 'Smart suggestions'],
      color: 'green'
    },
    {
      id: 'modeling',
      title: 'Modeling Document',
      description: 'Start with financial projections and modeling',
      icon: '📊',
      features: ['Financial blocks first', 'Charts and tables', 'Scenario planning'],
      color: 'purple'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'border-blue-200 bg-blue-50 hover:bg-blue-100',
      green: 'border-green-200 bg-green-50 hover:bg-green-100',
      purple: 'border-purple-200 bg-purple-50 hover:bg-purple-100'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getBadgeColor = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800 border-blue-300',
      green: 'bg-green-100 text-green-800 border-green-300',
      purple: 'bg-purple-100 text-purple-800 border-purple-300'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  if (selectedType) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {selectedType === 'create' && 'Create New Business Plan'}
              {selectedType === 'update' && 'Update Existing Plan'}
              {selectedType === 'modeling' && 'Financial Modeling Document'}
            </h2>
            <Button variant="outline" onClick={() => setSelectedType(null)}>
              Back
            </Button>
          </div>

          <div className="space-y-6">
            {/* Business Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Business Information</h3>
              <div>
                <label className="block text-sm font-medium mb-2">Business Name *</label>
                <Input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder={t("productSelector.businessNamePlaceholder")}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Business Description</label>
                <Textarea
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                  placeholder={t("productSelector.businessDescriptionPlaceholder")}
                  rows={3}
                  className="w-full"
                />
              </div>
            </div>

            {/* File Upload for Update */}
            {selectedType === 'update' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Upload Document</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".doc,.docx,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-gray-600 mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      Supports Word (.doc, .docx) and PDF files
                    </p>
                  </label>
                </div>
                {uploadedFile && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-green-800">{uploadedFile.name}</span>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedType === 'create') handleCreateNew();
                  if (selectedType === 'update') handleUpdate();
                  if (selectedType === 'modeling') handleModeling();
                }}
                disabled={
                  !businessName.trim() || 
                  (selectedType === 'update' && !uploadedFile)
                }
                className="bg-blue-600 hover:bg-blue-700"
              >
                {selectedType === 'create' && 'Create Plan'}
                {selectedType === 'update' && 'Upload & Enhance'}
                {selectedType === 'modeling' && 'Start Modeling'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Choose Your Document Type
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Select how you'd like to start creating your business plan. Each option is optimized for different needs and workflows.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {productOptions.map((option) => (
          <div
            key={option.id}
            className={`p-6 cursor-pointer transition-all duration-200 border-2 rounded-lg ${getColorClasses(option.color)} ${
              selectedType === option.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedType(option.id as any)}
          >
            <div className="text-center mb-4">
              <div className="text-4xl mb-3">{option.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {option.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {option.description}
              </p>
            </div>

            <div className="space-y-2 mb-6">
              {option.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <Badge className={getBadgeColor(option.color)}>
                {option.id === 'create' && 'Recommended'}
                {option.id === 'update' && 'Advanced'}
                {option.id === 'modeling' && 'Financial Focus'}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-8">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
