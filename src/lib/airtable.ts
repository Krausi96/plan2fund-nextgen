// Airtable Integration for Data Persistence
import { UserProfile, RecoContext, PlanDocument, GapTicket, EventLog } from './schemas/userProfile';

const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

interface AirtableResponse<T> {
  records: Array<{
    id: string;
    fields: T;
    createdTime: string;
  }>;
}

interface AirtableError {
  error: {
    type: string;
    message: string;
  };
}

class AirtableClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${AIRTABLE_BASE_URL}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, { ...options, headers });
      
      if (!response.ok) {
        const error: AirtableError = await response.json();
        throw new Error(`Airtable API error: ${error.error.message}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Airtable request failed:', error);
      throw error;
    }
  }

  // User Profile Operations
  async createUserProfile(profile: UserProfile): Promise<string> {
    const response = await this.request<{ id: string }>('/UserProfiles', {
      method: 'POST',
      body: JSON.stringify({
        records: [{
          fields: {
            'User ID': profile.id,
            'Segment': profile.segment,
            'Program Type': profile.programType,
            'Industry': profile.industry,
            'Language': profile.language,
            'Payer Type': profile.payerType,
            'Experience': profile.experience,
            'Created At': profile.createdAt,
            'Last Active At': profile.lastActiveAt,
            'GDPR Consent': profile.gdprConsent,
            'Data Retention Until': profile.dataRetentionUntil
          }
        }]
      })
    });
    return response.id;
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const response = await this.request<AirtableResponse<any>>(`/UserProfiles?filterByFormula={User ID}='${userId}'`);
      
      if (response.records.length === 0) return null;
      
      const record = response.records[0];
      return {
        id: record.fields['User ID'],
        segment: record.fields['Segment'],
        programType: record.fields['Program Type'],
        industry: record.fields['Industry'],
        language: record.fields['Language'],
        payerType: record.fields['Payer Type'],
        experience: record.fields['Experience'],
        createdAt: record.fields['Created At'],
        lastActiveAt: record.fields['Last Active At'],
        gdprConsent: record.fields['GDPR Consent'],
        dataRetentionUntil: record.fields['Data Retention Until']
      };
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile) return false;

      await this.request(`/UserProfiles`, {
        method: 'PATCH',
        body: JSON.stringify({
          records: [{
            id: profile.id,
            fields: {
              'Last Active At': updates.lastActiveAt || new Date().toISOString(),
              'GDPR Consent': updates.gdprConsent,
              'Data Retention Until': updates.dataRetentionUntil
            }
          }]
        })
      });
      return true;
    } catch (error) {
      console.error('Failed to update user profile:', error);
      return false;
    }
  }

  // Recommendation Context Operations
  async saveRecoContext(context: RecoContext): Promise<string> {
    const response = await this.request<{ id: string }>('/RecoContexts', {
      method: 'POST',
      body: JSON.stringify({
        records: [{
          fields: {
            'User ID': context.userId,
            'Answers': JSON.stringify(context.answers),
            'Signals': JSON.stringify(context.signals),
            'Mode': context.mode,
            'Program Type': context.programType,
            'Industry': context.industry,
            'Created At': context.createdAt
          }
        }]
      })
    });
    return response.id;
  }

  // Plan Document Operations
  async savePlanDocument(plan: PlanDocument): Promise<string> {
    const response = await this.request<{ id: string }>('/PlanDocuments', {
      method: 'POST',
      body: JSON.stringify({
        records: [{
          fields: {
            'Plan ID': plan.id,
            'User ID': plan.userId,
            'Title': plan.title,
            'Type': plan.type,
            'Program ID': plan.programId,
            'Sections': JSON.stringify(plan.sections),
            'Word Count': plan.metadata.wordCount,
            'Completion Percentage': plan.metadata.completionPercentage,
            'Last Edited At': plan.metadata.lastEditedAt,
            'Version': plan.metadata.version,
            'Created At': plan.createdAt,
            'Updated At': plan.updatedAt
          }
        }]
      })
    });
    return response.id;
  }

  async getPlanDocument(planId: string): Promise<PlanDocument | null> {
    try {
      const response = await this.request<AirtableResponse<any>>(`/PlanDocuments?filterByFormula={Plan ID}='${planId}'`);
      
      if (response.records.length === 0) return null;
      
      const record = response.records[0];
      return {
        id: record.fields['Plan ID'],
        userId: record.fields['User ID'],
        title: record.fields['Title'],
        type: record.fields['Type'],
        programId: record.fields['Program ID'],
        sections: JSON.parse(record.fields['Sections'] || '[]'),
        metadata: {
          wordCount: record.fields['Word Count'],
          completionPercentage: record.fields['Completion Percentage'],
          lastEditedAt: record.fields['Last Edited At'],
          version: record.fields['Version']
        },
        createdAt: record.fields['Created At'],
        updatedAt: record.fields['Updated At']
      };
    } catch (error) {
      console.error('Failed to get plan document:', error);
      return null;
    }
  }

  // Gap Ticket Operations
  async createGapTicket(ticket: GapTicket): Promise<string> {
    const response = await this.request<{ id: string }>('/GapTickets', {
      method: 'POST',
      body: JSON.stringify({
        records: [{
          fields: {
            'Ticket ID': ticket.id,
            'User ID': ticket.userId,
            'Reason': ticket.reason,
            'Context': JSON.stringify(ticket.context),
            'Suggested Programs': JSON.stringify(ticket.suggestedPrograms),
            'Status': ticket.status,
            'Created At': ticket.createdAt,
            'Resolved At': ticket.resolvedAt
          }
        }]
      })
    });
    return response.id;
  }

  // Event Logging
  async logEvent(event: EventLog): Promise<void> {
    try {
      await this.request('/EventLogs', {
        method: 'POST',
        body: JSON.stringify({
          records: [{
            fields: {
              'Event ID': event.id,
              'User ID': event.userId,
              'Event': event.event,
              'Properties': JSON.stringify(event.properties),
              'Timestamp': event.timestamp,
              'Session ID': event.sessionId,
              'User Agent': event.userAgent,
              'IP': event.ip
            }
          }]
        })
      });
    } catch (error) {
      console.error('Failed to log event:', error);
      // Don't throw - event logging should not break the user flow
    }
  }

  // GDPR Compliance
  async deleteUserData(userId: string): Promise<boolean> {
    try {
      // Delete user profile
      const profile = await this.getUserProfile(userId);
      if (profile) {
        await this.request(`/UserProfiles/${profile.id}`, { method: 'DELETE' });
      }

      // Delete recommendation contexts
      const recoContexts = await this.request<AirtableResponse<any>>(`/RecoContexts?filterByFormula={User ID}='${userId}'`);
      for (const record of recoContexts.records) {
        await this.request(`/RecoContexts/${record.id}`, { method: 'DELETE' });
      }

      // Delete plan documents
      const plans = await this.request<AirtableResponse<any>>(`/PlanDocuments?filterByFormula={User ID}='${userId}'`);
      for (const record of plans.records) {
        await this.request(`/PlanDocuments/${record.id}`, { method: 'DELETE' });
      }

      // Delete gap tickets
      const tickets = await this.request<AirtableResponse<any>>(`/GapTickets?filterByFormula={User ID}='${userId}'`);
      for (const record of tickets.records) {
        await this.request(`/GapTickets/${record.id}`, { method: 'DELETE' });
      }

      // Delete event logs
      const events = await this.request<AirtableResponse<any>>(`/EventLogs?filterByFormula={User ID}='${userId}'`);
      for (const record of events.records) {
        await this.request(`/EventLogs/${record.id}`, { method: 'DELETE' });
      }

      return true;
    } catch (error) {
      console.error('Failed to delete user data:', error);
      return false;
    }
  }
}

export const airtable = new AirtableClient();
export default airtable;
