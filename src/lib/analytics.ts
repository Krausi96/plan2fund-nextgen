// Mock analytics for demo purposes
export default {
  trackEvent: async (event: any) => {
    console.log('Analytics event:', event);
  },
  trackError: async (error: Error, context: string) => {
    console.error('Analytics error:', error, context);
  },
  setUserId: (userId: string) => {
    console.log('Analytics setUserId:', userId);
  },
  trackWizardStart: async (mode: string) => {
    console.log('Analytics trackWizardStart:', mode);
  },
  trackWizardComplete: async (answers: any, recommendations: any) => {
    console.log('Analytics trackWizardComplete:', answers, recommendations);
  },
  trackGapTicketCreated: async (reason: string, data: any) => {
    console.log('Analytics trackGapTicketCreated:', reason, data);
  },
  trackOnboardingComplete: async (profile: any) => {
    console.log('Analytics trackOnboardingComplete:', profile);
  },
  trackEditorComplete: (planId: string, completionPercentage: number, wordCount: number) => {
    console.log('Analytics trackEditorComplete:', planId, completionPercentage, wordCount);
  },
  trackTestimonialSubmit: async (planId: string, rating: number) => {
    console.log('Analytics trackTestimonialSubmit:', planId, rating);
  },
  trackSuccessHubView: (planId: string) => {
    console.log('Analytics trackSuccessHubView:', planId);
  },
  trackNextStepClick: (stepId: string, planId: string) => {
    console.log('Analytics trackNextStepClick:', stepId, planId);
  },
  trackEditorStart: (type: string, programId?: string) => {
    console.log('Analytics trackEditorStart:', type, programId);
  },
  trackEditorSectionEdit: (sectionId: string, sectionTitle: string, wordCount: number) => {
    console.log('Analytics trackEditorSectionEdit:', sectionId, sectionTitle, wordCount);
  }
};