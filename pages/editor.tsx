// Integrated Editor Page with All Phase 2 Components
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@/contexts/UserContext';
import SegmentedOnboarding from '@/components/onboarding/SegmentedOnboarding';
import ProgramAwareEditor from '@/components/editor/ProgramAwareEditor';
import AddOnChips from '@/components/addons/AddOnChips';
// import SuccessHub from '@/components/success/SuccessHub';
import { PlanDocument } from '@/lib/schemas/userProfile';
import exportManager from '@/lib/export';
import paymentManager from '@/lib/payments';
import analytics from '@/lib/analytics';
import featureFlags from '@/lib/featureFlags';

export default function EditorPage() {
  const router = useRouter();
  const { userProfile, isLoading, hasCompletedOnboarding } = useUser();
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<PlanDocument | null>(null);
  // const [showSuccessHub, setShowSuccessHub] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    // Check if user has completed onboarding
    if (!isLoading && !hasCompletedOnboarding) {
      // User needs to complete onboarding first
      return;
    }

    // Load selected program from URL params
    const { programId } = router.query;
    if (programId && typeof programId === 'string') {
      loadSelectedProgram(programId);
    }

    // Set feature flags context
    if (userProfile) {
      featureFlags.setUserContext(userProfile.segment, userProfile.id);
    }
  }, [isLoading, hasCompletedOnboarding, router.query, userProfile]);

  const loadSelectedProgram = async (programId: string) => {
    try {
      // In a real implementation, this would fetch from the programs API
      // For now, we'll create a mock program
      const program = {
        id: programId,
        name: 'Sample Program',
        type: userProfile?.programType?.toLowerCase() || 'grant',
        description: 'Sample program description'
      };
      setSelectedProgram(program);
    } catch (error) {
      console.error('Error loading selected program:', error);
    }
  };

  const handleOnboardingComplete = (_profile: any) => {
    // Onboarding completed, user profile is set in context
    // Redirect to editor or show program selection
    router.push('/editor');
  };

  const handleOnboardingSkip = () => {
    // User skipped onboarding, redirect to home
    router.push('/');
  };

  const handlePlanSave = (plan: PlanDocument) => {
    setCurrentPlan(plan);
    analytics.trackEditorComplete(plan.id, plan.metadata.completionPercentage, plan.metadata.wordCount);
  };

  const handlePlanExport = async (plan: PlanDocument) => {
    setIsExporting(true);
    try {
      // Check if user can export for free
      const canExportFree = exportManager.canExportFree(userProfile?.segment || '', plan.metadata.completionPercentage);
      
      if (canExportFree) {
        // Free export
        await exportManager.exportPlan(plan, {
          format: 'PDF',
          includeWatermark: true,
          isPaid: false,
          quality: 'draft'
        });
      } else {
        // Paid export - redirect to payment
        const pricing = exportManager.getExportPricing(userProfile?.segment || '');
        const items = [{
          id: 'export_pdf',
          name: 'PDF Export',
          description: 'Professional business plan export',
          amount: pricing.standard,
          currency: 'EUR',
          quantity: 1
        }];

        const session = await paymentManager.createPaymentSession(
          items,
          userProfile!,
          `${window.location.origin}/success?export=true`,
          `${window.location.origin}/editor?plan=${plan.id}`
        );

        if (session) {
          await paymentManager.redirectToCheckout(session.id);
        }
      }
    } catch (error) {
      console.error('Error exporting plan:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddOnClick = (addOnId: string) => {
    // Handle add-on click - could show details, purchase, or use the add-on
    console.log('Add-on clicked:', addOnId);
  };

  // const handleTestimonialSubmit = async (rating: number, feedback: string) => {
  //   try {
  //     // In a real implementation, this would save to the backend
  //     console.log('Testimonial submitted:', { rating, feedback });

  //     // Track testimonial submission
  //     await analytics.trackTestimonialSubmit(currentPlan?.id || '', rating);
  //   } catch (error) {
  //     console.error('Error submitting testimonial:', error);
  //   }
  // };

  // const handleExportSuccess = () => {
  //   setShowSuccessHub(true);
  // };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show onboarding if not completed
  if (!hasCompletedOnboarding) {
    return (
      <SegmentedOnboarding
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    );
  }

  // Show success hub if export was successful
  // if (showSuccessHub && currentPlan) {
  //   // Redirect to thank-you page instead of showing complex SuccessHub
  //   router.push('/thank-you');
  //   return null;
  // }

  // Show main editor
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Add-on chips at the top */}
      {userProfile && currentPlan && (
        <div className="bg-white border-b border-gray-200 p-4">
          <AddOnChips
            userProfile={userProfile}
            planId={currentPlan.id}
            currentSection="executive_summary" // This would be dynamic
            onAddOnClick={handleAddOnClick}
          />
        </div>
      )}

      {/* Main editor */}
      {userProfile && (
        <ProgramAwareEditor
          userProfile={userProfile}
          selectedProgram={selectedProgram}
          onSave={handlePlanSave}
          onExport={handlePlanExport}
        />
      )}

      {/* Export loading overlay */}
      {isExporting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Preparing your export...</p>
          </div>
        </div>
      )}
    </div>
  );
}
