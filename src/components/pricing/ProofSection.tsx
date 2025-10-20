// ========= PLAN2FUND — PROOF SECTION =========
// Proof section highlighting Austrian/EU compliance advantages

import React from 'react';
import { CheckCircle, FileText, Calculator, Globe, Shield, Clock, Users, Award } from 'lucide-react';

export function ProofSection() {
  const proofPoints = [
    {
      icon: FileText,
      title: 'Built to Austrian/EU expectations',
      description: 'Structured business plans, work packages, and budgets aligned with Austrian agencies and EU programs',
      details: [
        'Grant annexes compliance',
        'DSCR calculations for banks',
        'Due-diligence packs for investors',
        'Visa evidence requirements'
      ]
    },
    {
      icon: Calculator,
      title: 'Financials built with Austrian accounting terms',
      description: 'Umsatz, Eigenkapitalquote, DSCR, and other local terminology',
      details: [
        'Austrian accounting standards',
        'WKO guidelines compliance',
        'Bank-ready financial ratios',
        'EU cost categories'
      ]
    },
    {
      icon: Globe,
      title: 'Bilingual output & page-limit compliance',
      description: 'German/English depending on funder requirements with enforced page limits',
      details: [
        'No rejection for format errors',
        'Automatic page limit enforcement',
        'Language-specific formatting',
        'Call-specific requirements'
      ]
    },
    {
      icon: Shield,
      title: 'Copy-paste into portals & templates',
      description: 'Structured for easy transfer into official templates and submission portals',
      details: [
        'PDF/DOCX/XLSX formats',
        'Portal-ready formatting',
        'Template compatibility',
        'One-click export'
      ]
    }
  ];

  const stats = [
    { icon: Users, label: 'Target Groups', value: '4', description: 'Startups, SMEs, Advisors, Universities' },
    { icon: FileText, label: 'Document Types', value: '13+', description: 'Comprehensive document library' },
    { icon: Award, label: 'Funding Types', value: '4', description: 'Grants, Bank, Equity, Visa' },
    { icon: Clock, label: 'Turnaround', value: '48h', description: 'Rush delivery available' }
  ];

  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Snapshots
          </h2>
          <p className="text-lg text-gray-600 max-w-4xl mx-auto">
            Real outcomes from founders using Plan2Fund. Quick looks at how plans turned into
            funding, faster — across grants, banks, investors, and visas.
          </p>
        </div>

        {/* Proof Points */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {proofPoints.map((point, index) => (
            <div key={index} className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <point.icon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {point.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {point.description}
                  </p>
                  <ul className="space-y-2">
                    {point.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Trusted by Austrian Entrepreneurs
            </h3>
            <p className="text-gray-600">
              Comprehensive coverage across all funding types and target groups
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <stat.icon className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm font-medium text-gray-700 mb-1">{stat.label}</div>
                <div className="text-xs text-gray-600">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
