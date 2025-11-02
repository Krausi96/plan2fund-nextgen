// Comprehensive Analytics Implementation
interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp?: string;
}


class Analytics {
  private userId: string = '';
  private sessionId: string = '';
  private isInitialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Generate session ID if not exists
    if (typeof window !== 'undefined') {
      this.sessionId = localStorage.getItem('pf_session_id') || this.generateSessionId();
      localStorage.setItem('pf_session_id', this.sessionId);
      this.isInitialized = true;
    }
  }

  private generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  private async sendEvent(event: AnalyticsEvent) {
    if (!this.isInitialized) return;

    try {
      // Send to internal API
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...event,
          userId: this.userId || undefined,
          sessionId: this.sessionId,
          timestamp: new Date().toISOString(),
        }),
      });

      // Send to Google Analytics 4 (if available)
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', event.event, {
          ...event.properties,
          user_id: this.userId,
          session_id: this.sessionId,
        });
      }

      // Console log for development
      if (process.env.NODE_ENV === 'development') {
        console.log('Analytics event:', event);
      }
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }

  setUserId(userId: string) {
    this.userId = userId;
    
    // Set user ID in Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', 'GA_MEASUREMENT_ID', {
        user_id: userId,
      });
    }
  }

  // Core tracking methods
  async trackEvent(event: AnalyticsEvent) {
    await this.sendEvent(event);
  }

  async trackPageView(page: string, title?: string) {
    await this.sendEvent({
      event: 'page_view',
      properties: {
        page,
        title: title || page,
      },
    });
  }

  async trackUserAction(action: string, properties?: Record<string, any>) {
    await this.sendEvent({
      event: 'user_action',
      properties: {
        action,
        ...properties,
      },
    });
  }

  // Business-specific tracking methods
  async trackWizardStart(mode: string) {
    await this.sendEvent({
      event: 'wizard_started',
      properties: {
        mode,
        user_type: this.getUserType(),
      },
    });
  }

  async trackWizardComplete(answers: any, recommendations: any) {
    await this.sendEvent({
      event: 'wizard_completed',
      properties: {
        answers_count: Object.keys(answers).length,
        recommendations_count: recommendations?.length || 0,
        user_type: this.getUserType(),
        completion_time: this.getCompletionTime(),
      },
    });
  }

  async trackOnboardingComplete(profile: any) {
    await this.sendEvent({
      event: 'onboarding_completed',
      properties: {
        user_type: profile.segment,
        user_id: profile.id,
        onboarding_time: this.getCompletionTime(),
      },
    });
  }

  trackEditorStart(type: string, programId?: string) {
    this.sendEvent({
      event: 'editor_started',
      properties: {
        editor_type: type,
        program_id: programId,
        user_type: this.getUserType(),
      },
    });
  }

  trackEditorComplete(planId: string, completionPercentage: number, wordCount: number) {
    this.sendEvent({
      event: 'editor_completed',
      properties: {
        plan_id: planId,
        completion_percentage: completionPercentage,
        word_count: wordCount,
        user_type: this.getUserType(),
      },
    });
  }

  trackEditorSectionEdit(sectionId: string, sectionTitle: string, wordCount: number) {
    this.sendEvent({
      event: 'editor_section_edited',
      properties: {
        section_id: sectionId,
        section_title: sectionTitle,
        word_count: wordCount,
        user_type: this.getUserType(),
      },
    });
  }

  async trackTestimonialSubmit(planId: string, rating: number) {
    await this.sendEvent({
      event: 'testimonial_submitted',
      properties: {
        plan_id: planId,
        rating,
        user_type: this.getUserType(),
      },
    });
  }

  trackSuccessHubView(planId: string) {
    this.sendEvent({
      event: 'success_hub_viewed',
      properties: {
        plan_id: planId,
        user_type: this.getUserType(),
      },
    });
  }

  trackNextStepClick(stepId: string, planId: string) {
    this.sendEvent({
      event: 'next_step_clicked',
      properties: {
        step_id: stepId,
        plan_id: planId,
        user_type: this.getUserType(),
      },
    });
  }

  async trackGapTicketCreated(reason: string, data: any) {
    await this.sendEvent({
      event: 'gap_ticket_created',
      properties: {
        reason,
        data,
        user_type: this.getUserType(),
      },
    });
  }

  async trackError(error: Error, context: string) {
    await this.sendEvent({
      event: 'error_occurred',
      properties: {
        error_message: error.message,
        error_stack: error.stack,
        context,
        user_type: this.getUserType(),
      },
    });
  }

  // Conversion tracking
  async trackConversion(conversionType: string, value?: number, currency?: string) {
    await this.sendEvent({
      event: 'conversion',
      properties: {
        conversion_type: conversionType,
        value,
        currency: currency || 'EUR',
        user_type: this.getUserType(),
      },
    });
  }

  // Engagement tracking
  async trackEngagement(action: string, duration?: number) {
    await this.sendEvent({
      event: 'engagement',
      properties: {
        action,
        duration,
        user_type: this.getUserType(),
      },
    });
  }

  // Helper methods
  private getUserType(): string {
    if (typeof window !== 'undefined') {
      const profile = localStorage.getItem('pf_user_profile');
      if (profile) {
        try {
          const parsed = JSON.parse(profile);
          return parsed.segment || 'unknown';
        } catch {
          return 'unknown';
        }
      }
    }
    return 'unknown';
  }

  private getCompletionTime(): number {
    // This would be calculated based on when the process started
    // For now, return a placeholder
    return Date.now();
  }

  // GDPR compliance
  async trackConsentGiven(consentType: string) {
    await this.sendEvent({
      event: 'consent_given',
      properties: {
        consent_type: consentType,
        timestamp: new Date().toISOString(),
      },
    });
  }

  async trackDataDeletion(userId: string) {
    await this.sendEvent({
      event: 'data_deletion_requested',
      properties: {
        user_id: userId,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

export default new Analytics();