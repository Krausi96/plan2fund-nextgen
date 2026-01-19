import React from 'react';
import { createPortal } from 'react-dom';
import type { ProductType } from '@/features/editor/lib';

interface LivePreviewBoxProps {
  formData: {
    title: string;
    subtitle: string;
    companyName: string;
    legalForm: string;
    contactInfo?: {
      email?: string;
      phone?: string;
      website?: string;
      address?: string;
    };
  };
  productType?: ProductType;
}

const LivePreviewBox: React.FC<LivePreviewBoxProps> = ({ formData, productType }) => {
  // Simple translations
  const t = {
    businessPlan: 'Business Plan',
    author: 'Author',
    email: 'Email',
    phone: 'Phone',
    website: 'Website',
    address: 'Address',
    date: 'Date',
  };

  // Get product-specific title
  const getProductTitle = () => {
    if (!productType) return null;
    switch (productType) {
      case 'strategy': return 'Strategy Plan';
      case 'review': return 'Review Plan';
      case 'submission': return 'Submission Plan';
      default: return 'Business Plan';
    }
  };

  const productTitle = getProductTitle();

  // CLEAN: Proper A4 structure with header-top, content-middle, footer-bottom
  const previewElement = (
    <div className="fixed top-4 right-4 w-96 h-[600px] bg-slate-800/95 backdrop-blur-sm rounded-lg border border-slate-600 shadow-2xl z-[999999] flex flex-col">
      {/* Window Header */}
      <div className="flex items-center justify-between p-2 bg-slate-700 rounded-t-lg">
        <div className="flex items-center gap-2">
          <h3 className="text-white font-medium text-sm">📄 Live Preview</h3>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
        </div>
        <div className="flex items-center gap-1">
          <button className="w-6 h-6 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors">
            🎨
          </button>
          <button className="w-6 h-6 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors">
            −
          </button>
          <button className="w-6 h-6 flex items-center justify-center text-white/70 hover:text-white hover:bg-red-500/20 rounded transition-colors">
            ×
          </button>
        </div>
      </div>
      
      {/* Content Area - PROPER A4 STRUCTURE */}
      <div className="flex-1 p-3 overflow-hidden">
        <div className="w-full h-full bg-white rounded border border-gray-300 overflow-auto">
          {/* Container with proper padding */}
          <div className="p-6 h-full">
            {/* Full height flex container for proper A4 layout */}
            <div className="flex flex-col justify-between h-full">
              {/* HEADER - Top section */}
              <div className="flex-shrink-0 text-center">
                <div className="h-20 w-20 bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 font-medium mx-auto mb-4">
                  Logo
                </div>
                {productTitle && (
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-3">
                    {productTitle}
                  </p>
                )}
                {formData.title && (
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {formData.title}
                  </h1>
                )}
                {formData.subtitle && (
                  <p className="text-sm text-gray-700 italic max-w-md mx-auto">
                    {formData.subtitle}
                  </p>
                )}
                {(formData.companyName || formData.legalForm) && (
                  <div className="mt-4">
                    <div className="text-lg font-semibold text-gray-800">
                      {formData.companyName}{formData.legalForm ? ` (${formData.legalForm})` : ''}
                    </div>
                  </div>
                )}
              </div>
              
              {/* MIDDLE - Spacer (flex-1 pushes footer to bottom) */}
              <div className="flex-1"></div>
              
              {/* FOOTER - Bottom section */}
              <div className="flex-shrink-0">
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-800 mb-2">
                    <span className="font-bold">{t.author}:</span> {formData.companyName || 'Your Name'}
                  </p>
                  <div className="space-y-1 text-xs text-gray-700 mb-3">
                    {formData.contactInfo?.email && (
                      <p><span className="font-medium">{t.email}:</span> {formData.contactInfo.email}</p>
                    )}
                    {formData.contactInfo?.phone && (
                      <p><span className="font-medium">{t.phone}:</span> {formData.contactInfo.phone}</p>
                    )}
                    {formData.contactInfo?.website && (
                      <p><span className="font-medium">{t.website}:</span> {formData.contactInfo.website}</p>
                    )}
                    {formData.contactInfo?.address && (
                      <p><span className="font-medium">{t.address}:</span> {formData.contactInfo.address}</p>
                    )}
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-700">
                      <span className="font-medium">{t.date}:</span> {new Date().toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-600 italic">
                      Confidential
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(previewElement, document.body) : null;
};

export default LivePreviewBox;