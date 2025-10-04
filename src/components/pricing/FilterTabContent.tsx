import React from 'react';
import { ArrowRight } from 'lucide-react';
import { type Product, type FundingType, type TargetGroup } from '@/data/basisPack';

interface FilterTabContentProps {
  activeTab: 'product' | 'funding' | 'target';
  selectedProduct: Product;
  selectedFunding: FundingType;
  selectedTarget: TargetGroup;
  onProductSelect: (product: Product) => void;
  onFundingSelect: (funding: FundingType) => void;
  onTargetSelect: (target: TargetGroup) => void;
}

export function FilterTabContent({
  activeTab,
  selectedProduct,
  selectedFunding,
  selectedTarget,
  onProductSelect,
  onFundingSelect,
  onTargetSelect
}: FilterTabContentProps) {
  const products = [
    {
      id: 'strategy' as Product,
      name: 'Strategy Plan',
      icon: '🎯',
      description: 'Idea-stage founders exploring funding options',
      price: '€99',
      color: 'blue'
    },
    {
      id: 'review' as Product,
      name: 'Review Plan', 
      icon: '📝',
      description: 'Founders with a draft plan needing polish',
      price: '€149',
      color: 'green'
    },
    {
      id: 'submission' as Product,
      name: 'Submission Plan',
      icon: '🚀', 
      description: 'Ready-to-apply founders',
      price: '€199',
      color: 'purple'
    }
  ];

  const fundingTypes = [
    {
      id: 'grants' as FundingType,
      name: 'Grants',
      icon: '🏛️',
      description: 'Government & EU funding programs',
      color: 'green'
    },
    {
      id: 'bankLoans' as FundingType,
      name: 'Bank Loans',
      icon: '💰',
      description: 'Traditional bank financing',
      color: 'blue'
    },
    {
      id: 'equity' as FundingType,
      name: 'Equity',
      icon: '💼',
      description: 'Investor funding & VC',
      color: 'purple'
    },
    {
      id: 'visa' as FundingType,
      name: 'Visa',
      icon: '✈️',
      description: 'Immigration & visa applications',
      color: 'orange'
    }
  ];

  const targetGroups = [
    {
      id: 'startups' as TargetGroup,
      name: 'Startups',
      icon: '🚀',
      description: 'Early-stage companies',
      color: 'blue'
    },
    {
      id: 'sme' as TargetGroup,
      name: 'SMEs',
      icon: '🏢',
      description: 'Small & medium enterprises',
      color: 'green'
    },
    {
      id: 'advisors' as TargetGroup,
      name: 'Advisors',
      icon: '👨‍💼',
      description: 'Business consultants & advisors',
      color: 'purple'
    },
    {
      id: 'universities' as TargetGroup,
      name: 'Universities',
      icon: '🎓',
      description: 'Academic institutions & research',
      color: 'indigo'
    }
  ];

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colorMap = {
      blue: isSelected ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-blue-50 border-blue-200 text-blue-600 hover:border-blue-300',
      green: isSelected ? 'bg-green-50 border-green-500 text-green-700' : 'bg-green-50 border-green-200 text-green-600 hover:border-green-300',
      purple: isSelected ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-purple-50 border-purple-200 text-purple-600 hover:border-purple-300',
      orange: isSelected ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-orange-50 border-orange-200 text-orange-600 hover:border-orange-300',
      indigo: isSelected ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:border-indigo-300'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  if (activeTab === 'product') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {products.map((product) => {
          const isSelected = selectedProduct === product.id;
          return (
            <button
              key={product.id}
              onClick={() => onProductSelect(product.id)}
              className={`
                p-6 rounded-xl border-2 transition-all text-left
                ${getColorClasses(product.color, isSelected)}
                ${isSelected ? 'ring-2 ring-offset-2' : 'hover:shadow-md'}
              `}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{product.icon}</span>
                <div>
                  <h3 className="text-lg font-semibold">{product.name}</h3>
                  <div className="text-sm font-bold">{product.price}</div>
                </div>
              </div>
              <p className="text-sm opacity-80">{product.description}</p>
              {isSelected && (
                <div className="flex items-center gap-1 mt-3 text-sm font-medium">
                  <span>Selected</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  if (activeTab === 'funding') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {fundingTypes.map((funding) => {
          const isSelected = selectedFunding === funding.id;
          return (
            <button
              key={funding.id}
              onClick={() => onFundingSelect(funding.id)}
              className={`
                p-4 rounded-lg border-2 transition-all text-center
                ${getColorClasses(funding.color, isSelected)}
                ${isSelected ? 'ring-2 ring-offset-2' : 'hover:shadow-md'}
              `}
            >
              <div className="text-2xl mb-2">{funding.icon}</div>
              <div className="font-semibold text-sm">{funding.name}</div>
              <div className="text-xs opacity-80 mt-1">{funding.description}</div>
            </button>
          );
        })}
      </div>
    );
  }

  if (activeTab === 'target') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {targetGroups.map((target) => {
          const isSelected = selectedTarget === target.id;
          return (
            <button
              key={target.id}
              onClick={() => onTargetSelect(target.id)}
              className={`
                p-4 rounded-lg border-2 transition-all text-center
                ${getColorClasses(target.color, isSelected)}
                ${isSelected ? 'ring-2 ring-offset-2' : 'hover:shadow-md'}
              `}
            >
              <div className="text-2xl mb-2">{target.icon}</div>
              <div className="font-semibold text-sm">{target.name}</div>
              <div className="text-xs opacity-80 mt-1">{target.description}</div>
            </button>
          );
        })}
      </div>
    );
  }

  return null;
}
