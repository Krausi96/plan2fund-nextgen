import React from 'react';
import { CheckCircle, FileText, Users } from 'lucide-react';

interface FilterTabsProps {
  activeTab: 'product' | 'funding' | 'target';
  onTabChange: (tab: 'product' | 'funding' | 'target') => void;
  selectedProduct: string;
  selectedFunding: string;
  selectedTarget: string;
}

export function FilterTabs({ 
  activeTab, 
  onTabChange, 
  selectedProduct, 
  selectedFunding, 
  selectedTarget 
}: FilterTabsProps) {
  const tabs = [
    {
      id: 'product' as const,
      label: 'Product Type',
      icon: FileText,
      count: selectedProduct ? 1 : 0,
      color: 'blue'
    },
    {
      id: 'funding' as const,
      label: 'Funding Type',
      icon: CheckCircle,
      count: selectedFunding ? 1 : 0,
      color: 'green'
    },
    {
      id: 'target' as const,
      label: 'Target Group',
      icon: Users,
      count: selectedTarget ? 1 : 0,
      color: 'purple'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all
                ${isActive 
                  ? `bg-${tab.color}-50 text-${tab.color}-700 border-b-2 border-${tab.color}-500` 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`
                  inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full
                  ${isActive ? `bg-${tab.color}-500 text-white` : 'bg-gray-300 text-gray-600'}
                `}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
