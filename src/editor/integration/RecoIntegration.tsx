// ========= PLAN2FUND — RECO INTEGRATION =========
// Handles data flow from Reco to Editor

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { PlanDocument, Route, Product } from '@/types/plan';
import { ProgramProfile } from '@/types/reco';
import { getProgramProfile } from '../../reco/programProfiles';
import { TEMPLATES, buildRouteTemplate } from '../templates/registry';

interface RecoIntegrationProps {
  children: React.ReactNode;
  onPlanChange: (plan: PlanDocument) => void;
  onProgramProfileChange: (profile: ProgramProfile | null) => void;
}

export default function RecoIntegration({ 
  children, 
  onPlanChange, 
  onProgramProfileChange 
}: RecoIntegrationProps) {
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeFromReco();
  }, [router.query]);

  const initializeFromReco = () => {
    const { route, programId, product } = router.query;
    
    if (!route || !product) {
      setIsInitialized(true);
      return;
    }

    // Create initial plan document
    const initialPlan: PlanDocument = {
      id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ownerId: 'user_' + Date.now(),
      product: product as Product,
      route: route as Route,
      programId: programId as string,
      language: 'en',
      tone: 'neutral',
      targetLength: 'standard',
      settings: {
        includeTitlePage: true,
        includePageNumbers: true,
        citations: 'simple',
        captions: true,
        graphs: {
          revenueCosts: true,
          cashflow: true,
          useOfFunds: true
        }
      },
      sections: [],
      addonPack: false,
      versions: []
    };

    // Load program profile if programId provided
    let programProfile: ProgramProfile | null = null;
    if (programId) {
      programProfile = getProgramProfile(programId as string);
    }

    // Build template based on product and route
    const baseTemplate = TEMPLATES[product as keyof typeof TEMPLATES];
    if (baseTemplate) {
      const routeTemplate = buildRouteTemplate(baseTemplate, route as Route);
      initialPlan.sections = routeTemplate.sections.map(section => ({
        key: section.key,
        title: section.title,
        content: '',
        status: 'missing' as const
      }));
    }

    // Handle Review template (inherit from submission)
    if (product === 'review') {
      const submissionTemplate = buildRouteTemplate(TEMPLATES.submission, route as Route);
      initialPlan.sections = submissionTemplate.sections.map(section => ({
        key: section.key,
        title: section.title,
        content: '',
        status: 'needs_fix' as const,
        guidance: 'Paste your existing text here for review and improvement'
      }));
    }

    onPlanChange(initialPlan);
    onProgramProfileChange(programProfile);
    setIsInitialized(true);
  };

  // const handleRouteChange = (newRoute: Route) => {
  //   // Update URL and reinitialize
  //   router.push({
  //     pathname: router.pathname,
  //     query: { ...router.query, route: newRoute }
  //   }, undefined, { shallow: true });
  // };

  // const handleProgramChange = (newProgramId: string | null) => {
  //   // Update URL and reinitialize
  //   router.push({
  //     pathname: router.pathname,
  //     query: { ...router.query, programId: newProgramId }
  //   }, undefined, { shallow: true });
  // };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div>Loading editor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="reco-integration">
      {children}
    </div>
  );
}

// Hook for accessing Reco data in editor components
export function useRecoData() {
  const router = useRouter();
  const { route, programId, product } = router.query;

  return {
    route: route as Route | undefined,
    programId: programId as string | undefined,
    product: product as Product | undefined,
    programProfile: programId ? getProgramProfile(programId as string) : null
  };
}
