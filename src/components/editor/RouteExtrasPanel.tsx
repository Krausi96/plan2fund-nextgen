/**
 * Route Extras Panel for Editor Right Rail
 * Shows included deliverables for submission & review plans
 * Displays checkmarks for extras that apply to selected route/program
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Info, XCircle } from 'lucide-react';
import { getRouteExtrasForPlan } from '@/lib/routeExtras';

interface RouteExtrasPanelProps {
  planType: 'strategy' | 'review' | 'custom';
  selectedRoute?: string;
  selectedProgram?: any;
}

export default function RouteExtrasPanel({ 
  planType, 
  selectedRoute
  // selectedProgram 
}: RouteExtrasPanelProps) {
  const [expandedExtra, setExpandedExtra] = useState<string | null>(null);

  // Only show for submission & review plans (not strategy)
  if (planType === 'strategy') {
    return null;
  }

  const routeExtras = getRouteExtrasForPlan(planType, selectedRoute);
  
  if (routeExtras.length === 0) {
    return null;
  }

  const handleExtraClick = (extraId: string) => {
    setExpandedExtra(expandedExtra === extraId ? null : extraId);
  };

  return (
    <Card className="p-4 mb-4">
      <div className="flex items-center mb-3">
        <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
        <h3 className="font-semibold text-gray-900">Route Extras</h3>
        <Badge variant="secondary" className="ml-2 text-xs">
          Included
        </Badge>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Additional deliverables included when relevant to your selected route:
      </p>

      <div className="space-y-3">
        {routeExtras.map((extra) => (
          <div key={extra.id} className="border border-gray-200 rounded-lg p-3">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => handleExtraClick(extra.id)}
            >
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-900">
                  {extra.name}
                </span>
              </div>
              <Info className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </div>
            
            {expandedExtra === extra.id && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-600 mb-2">
                  {extra.description}
                </p>
                {extra.template && (
                  <div className="mb-2">
                    <span className="text-xs font-medium text-blue-600">Template:</span>
                    <span className="text-xs text-gray-600 ml-1">{extra.template}</span>
                  </div>
                )}
                {extra.userAttachment && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                    <div className="flex items-start">
                      <XCircle className="w-3 h-3 text-yellow-600 mr-1 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-yellow-800">
                        <strong>You must attach:</strong> {extra.userAttachment}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>Note:</strong> These extras are automatically included in your export when relevant to your chosen route. Non-applicable items are omitted to keep exports clean.
        </p>
      </div>
    </Card>
  );
}
