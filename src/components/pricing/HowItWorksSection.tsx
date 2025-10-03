// ========= PLAN2FUND — HOW IT WORKS SECTION =========
// 5-step process timeline

import React from 'react';
import { CheckCircle, FileText, Plus, Download, ArrowRight } from 'lucide-react';

export function HowItWorksSection() {
  const steps = [
    {
      icon: CheckCircle,
      title: 'Pick your plan',
      description: 'Strategy, Review, Submission',
      details: 'Choose the plan that matches your current stage and funding goals'
    },
    {
      icon: FileText,
      title: 'Select funding type',
      description: 'Grants, Bank, Equity, Visa',
      details: 'Tell us which funding route you\'re pursuing to get the right documents'
    },
    {
      icon: FileText,
      title: 'See included docs',
      description: 'Counts & descriptions above',
      details: 'Review exactly what documents you\'ll receive and what you need to provide'
    },
    {
      icon: Plus,
      title: 'Add extras',
      description: 'Rush, consultation, translation',
      details: 'Enhance your plan with add-ons tailored to your funding type'
    },
    {
      icon: Download,
      title: 'Apply with confidence',
      description: 'Aligned with Austrian/EU standards',
      details: 'Download your funder-ready documents and submit with confidence'
    }
  ];

  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Simple 5-step process to get your funding-ready documents
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden md:block absolute top-16 left-0 right-0 h-0.5 bg-gray-200">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Step Number */}
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center relative z-10">
                    <step.icon className="w-8 h-8 text-blue-600" />
                  </div>
                </div>

                {/* Step Content */}
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{step.description}</p>
                  <p className="text-xs text-gray-500">{step.details}</p>
                </div>

                {/* Arrow (hidden on mobile) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-full w-8 h-8 flex items-center justify-center">
                    <ArrowRight className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Microcopy */}
        <div className="mt-12 text-center">
          <div className="bg-gray-50 rounded-2xl p-6 max-w-4xl mx-auto">
            <p className="text-gray-700 mb-2">
              <strong>We generate the submission documents; you supply personal/company records required by the funder.</strong>
            </p>
            <p className="text-sm text-gray-600">
              Every document is tailored to Austrian and EU funding requirements, ensuring compliance and maximizing your chances of success.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
