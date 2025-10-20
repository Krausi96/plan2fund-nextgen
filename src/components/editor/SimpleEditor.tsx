// ========= SIMPLE EDITOR =========
// Clean, intuitive editor interface with proper error handling

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useI18n } from '../../contexts/I18nContext';

interface SimpleEditorProps {
  programId?: string | null;
  product?: string;
  route?: string;
  answers?: Record<string, any>;
}

export default function SimpleEditor({
  programId: propProgramId,
  product: propProduct,
  route: propRoute,
  answers: propAnswers
}: SimpleEditorProps) {
  const router = useRouter();
  const { t } = useI18n();
  
  // Get programId from props or URL
  const programId = propProgramId || (router.query.programId as string);
  
  // State
  const [selectedProduct, setSelectedProduct] = useState<string>(propProduct || '');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'edit' | 'error'>('select');

  // Products
  const products = [
    { id: 'strategy', name: 'Strategy', description: 'Core strategy documents', price: '€99' },
    { id: 'review', name: 'Review', description: 'Professional review', price: '€149' },
    { id: 'submission', name: 'Submission', description: 'Complete business plans', price: '€199' }
  ];

  // Templates based on product
  const getTemplates = (productId: string) => {
    const templates: Record<string, any[]> = {
      strategy: [
        { id: 'business-model', name: 'Business Model Canvas', description: 'Visual business model' },
        { id: 'go-to-market', name: 'Go-to-Market Strategy', description: 'Market entry plan' },
        { id: 'funding-fit', name: 'Funding Fit Summary', description: 'Funding readiness' }
      ],
      review: [
        { id: 'business-plan-review', name: 'Business Plan Review', description: 'Comprehensive review' },
        { id: 'compliance-check', name: 'Compliance Check', description: 'Regulatory compliance' }
      ],
      submission: [
        { id: 'grant-proposal', name: 'Grant Proposal', description: 'EU/Austrian grants' },
        { id: 'loan-application', name: 'Loan Application', description: 'Bank loan application' },
        { id: 'pitch-deck', name: 'Pitch Deck', description: 'Investor presentation' }
      ]
    };
    return templates[productId] || [];
  };

  // Handle product selection
  const handleProductSelect = (productId: string) => {
    setSelectedProduct(productId);
    setSelectedTemplate('');
    setError(null);
  };

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    setError(null);
  };

  // Start editing
  const handleStartEditing = async () => {
    if (!selectedProduct || !selectedTemplate) {
      setError('Please select both a product and template');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Simulate loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check for compatibility issues
      if (selectedProduct === 'strategy' && selectedTemplate === 'loan-application') {
        throw new Error('Strategy product is not compatible with loan applications. Please select a different template.');
      }

      setStep('edit');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Go back to selection
  const handleGoBack = () => {
    setStep('select');
    setError(null);
  };

  // Go to recommendations
  const handleGoToReco = () => {
    router.push('/reco');
  };

  // Render selection step
  if (step === 'select') {
    return (
      <>
        <Head>
          <title>Editor - Plan2Fund</title>
          <meta name="description" content="Create your business plan" />
        </Head>
        
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-4xl mx-auto px-4">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Create Your Plan</h1>
              <p className="text-lg text-gray-600">Choose a product and template to get started</p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-red-600 mr-3">⚠️</div>
                  <div>
                    <h3 className="text-red-800 font-medium">Error</h3>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Product Selection */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Select Product</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleProductSelect(product.id)}
                    className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedProduct === product.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">
                        {product.id === 'strategy' && '🎯'}
                        {product.id === 'review' && '📝'}
                        {product.id === 'submission' && '📄'}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">{product.description}</p>
                      <div className="text-lg font-bold text-blue-600">{product.price}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Template Selection */}
            {selectedProduct && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Select Template</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getTemplates(selectedProduct).map((template) => (
                    <div
                      key={template.id}
                      onClick={() => handleTemplateSelect(template.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedTemplate === template.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      <p className="text-gray-600 text-sm">{template.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleGoToReco}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Find Funding First
              </button>
              <button
                onClick={handleStartEditing}
                disabled={!selectedProduct || !selectedTemplate || isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Starting...' : 'Start Editing'}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Render error step
  if (step === 'error') {
    return (
      <>
        <Head>
          <title>Error - Plan2Fund Editor</title>
        </Head>
        
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md mx-auto px-4 text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Configuration Error</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={handleGoBack}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Different Selection
              </button>
              <button
                onClick={handleGoToReco}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Find Funding First
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Render editing step
  return (
    <>
      <Head>
        <title>Editor - Plan2Fund</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        {/* Simple Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {products.find(p => p.id === selectedProduct)?.name} Editor
              </h1>
              <p className="text-sm text-gray-600">
                Template: {getTemplates(selectedProduct).find(t => t.id === selectedTemplate)?.name}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleGoBack}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => router.push('/preview')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Preview
              </button>
            </div>
          </div>
        </div>

        {/* Simple Editor Content */}
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Start Writing</h2>
            <p className="text-gray-600 mb-6">
              This is a simplified editor. The full editor with sections, AI assistance, and templates will be available soon.
            </p>
            
            <textarea
              placeholder="Start writing your business plan here..."
              className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            
            <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
              <span>Word count: 0</span>
              <span>Auto-saved</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
