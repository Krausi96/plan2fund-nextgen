/**
 * Team Management System
 * Handles team seats, brand styles, and reviewer mode
 */


export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer' | 'reviewer';
  permissions: string[];
  joinedAt: string;
  lastActive: string;
  status: 'active' | 'invited' | 'suspended';
}

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  members: TeamMember[];
  maxSeats: number;
  usedSeats: number;
  plan: 'free' | 'pro' | 'business' | 'enterprise';
  createdAt: string;
  updatedAt: string;
}

export interface BrandStyle {
  id: string;
  teamId: string;
  name: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontSize: number;
  spacing: 'compact' | 'normal' | 'relaxed';
  theme: 'light' | 'dark' | 'auto';
  customCSS?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSession {
  id: string;
  planId: string;
  reviewerId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  comments: ReviewComment[];
  suggestions: ReviewSuggestion[];
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewComment {
  id: string;
  sectionId: string;
  content: string;
  type: 'suggestion' | 'question' | 'praise' | 'concern';
  priority: 'low' | 'medium' | 'high';
  resolved: boolean;
  createdAt: string;
  authorId: string;
}

export interface ReviewSuggestion {
  id: string;
  sectionId: string;
  title: string;
  description: string;
  action: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  authorId: string;
}

export class TeamManager {
  private teams: Map<string, Team> = new Map();
  private brandStyles: Map<string, BrandStyle> = new Map();
  private reviewSessions: Map<string, ReviewSession> = new Map();

  // Team Management
  async createTeam(ownerId: string, teamName: string, plan: string = 'free'): Promise<Team> {
    const team: Team = {
      id: `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: teamName,
      ownerId,
      members: [{
        id: `member_${Date.now()}`,
        email: '', // Will be filled from user profile
        name: '',
        role: 'owner',
        permissions: ['all'],
        joinedAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        status: 'active'
      }],
      maxSeats: this.getMaxSeatsForPlan(plan),
      usedSeats: 1,
      plan: plan as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.teams.set(team.id, team);
    return team;
  }

  async inviteMember(teamId: string, email: string, role: string, _invitedBy: string): Promise<boolean> {
    const team = this.teams.get(teamId);
    if (!team) return false;

    if (team.usedSeats >= team.maxSeats) {
      throw new Error('Team has reached maximum seat limit');
    }

    const member: TeamMember = {
      id: `member_${Date.now()}`,
      email,
      name: '',
      role: role as any,
      permissions: this.getPermissionsForRole(role),
      joinedAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      status: 'invited'
    };

    team.members.push(member);
    team.usedSeats++;
    team.updatedAt = new Date().toISOString();

    return true;
  }

  async removeMember(teamId: string, memberId: string): Promise<boolean> {
    const team = this.teams.get(teamId);
    if (!team) return false;

    const memberIndex = team.members.findIndex(m => m.id === memberId);
    if (memberIndex === -1) return false;

    team.members.splice(memberIndex, 1);
    team.usedSeats--;
    team.updatedAt = new Date().toISOString();

    return true;
  }

  async updateMemberRole(teamId: string, memberId: string, newRole: string): Promise<boolean> {
    const team = this.teams.get(teamId);
    if (!team) return false;

    const member = team.members.find(m => m.id === memberId);
    if (!member) return false;

    member.role = newRole as any;
    member.permissions = this.getPermissionsForRole(newRole);
    team.updatedAt = new Date().toISOString();

    return true;
  }

  // Brand Style Management
  async createBrandStyle(teamId: string, styleData: Partial<BrandStyle>): Promise<BrandStyle> {
    const brandStyle: BrandStyle = {
      id: `brand_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      teamId,
      name: styleData.name || 'Default Brand Style',
      logo: styleData.logo,
      primaryColor: styleData.primaryColor || '#3B82F6',
      secondaryColor: styleData.secondaryColor || '#1E40AF',
      fontFamily: styleData.fontFamily || 'Inter',
      fontSize: styleData.fontSize || 14,
      spacing: styleData.spacing || 'normal',
      theme: styleData.theme || 'light',
      customCSS: styleData.customCSS,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.brandStyles.set(brandStyle.id, brandStyle);
    return brandStyle;
  }

  async updateBrandStyle(styleId: string, updates: Partial<BrandStyle>): Promise<boolean> {
    const style = this.brandStyles.get(styleId);
    if (!style) return false;

    Object.assign(style, updates);
    style.updatedAt = new Date().toISOString();

    return true;
  }

  async getBrandStyle(teamId: string): Promise<BrandStyle | null> {
    for (const style of this.brandStyles.values()) {
      if (style.teamId === teamId) {
        return style;
      }
    }
    return null;
  }

  // Reviewer Mode
  async createReviewSession(planId: string, reviewerId: string): Promise<ReviewSession> {
    const session: ReviewSession = {
      id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      planId,
      reviewerId,
      status: 'pending',
      comments: [],
      suggestions: [],
      rating: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.reviewSessions.set(session.id, session);
    return session;
  }

  async addReviewComment(sessionId: string, comment: Omit<ReviewComment, 'id' | 'createdAt'>): Promise<boolean> {
    const session = this.reviewSessions.get(sessionId);
    if (!session) return false;

    const newComment: ReviewComment = {
      id: `comment_${Date.now()}`,
      ...comment,
      createdAt: new Date().toISOString()
    };

    session.comments.push(newComment);
    session.updatedAt = new Date().toISOString();

    return true;
  }

  async addReviewSuggestion(sessionId: string, suggestion: Omit<ReviewSuggestion, 'id' | 'createdAt'>): Promise<boolean> {
    const session = this.reviewSessions.get(sessionId);
    if (!session) return false;

    const newSuggestion: ReviewSuggestion = {
      id: `suggestion_${Date.now()}`,
      ...suggestion,
      createdAt: new Date().toISOString()
    };

    session.suggestions.push(newSuggestion);
    session.updatedAt = new Date().toISOString();

    return true;
  }

  async completeReview(sessionId: string, rating: number): Promise<boolean> {
    const session = this.reviewSessions.get(sessionId);
    if (!session) return false;

    session.status = 'completed';
    session.rating = rating;
    session.updatedAt = new Date().toISOString();

    return true;
  }

  // Utility Methods
  private getMaxSeatsForPlan(plan: string): number {
    switch (plan) {
      case 'free': return 1;
      case 'pro': return 3;
      case 'business': return 10;
      case 'enterprise': return 50;
      default: return 1;
    }
  }

  private getPermissionsForRole(role: string): string[] {
    switch (role) {
      case 'owner':
        return ['all'];
      case 'admin':
        return ['edit', 'delete', 'invite', 'review'];
      case 'editor':
        return ['edit', 'review'];
      case 'viewer':
        return ['view'];
      case 'reviewer':
        return ['view', 'review', 'comment'];
      default:
        return ['view'];
    }
  }

  // Getters
  async getTeam(teamId: string): Promise<Team | null> {
    return this.teams.get(teamId) || null;
  }

  async getTeamByUserId(userId: string): Promise<Team | null> {
    for (const team of this.teams.values()) {
      if (team.members.some(member => member.id === userId)) {
        return team;
      }
    }
    return null;
  }

  async getReviewSession(sessionId: string): Promise<ReviewSession | null> {
    return this.reviewSessions.get(sessionId) || null;
  }

  async getReviewSessionsByReviewer(reviewerId: string): Promise<ReviewSession[]> {
    return Array.from(this.reviewSessions.values())
      .filter(session => session.reviewerId === reviewerId);
  }

  async getReviewSessionsByPlan(planId: string): Promise<ReviewSession[]> {
    return Array.from(this.reviewSessions.values())
      .filter(session => session.planId === planId);
  }
}

export const teamManager = new TeamManager();
export default teamManager;
