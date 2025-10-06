/**
 * Multi-User Data Management System
 * Handles user-specific data storage, isolation, and collaboration
 */

import { PlanDocument } from '@/types/plan';
import { UserProfile } from '@/lib/schemas/userProfile';

export interface UserPlan {
  id: string;
  userId: string;
  plan: PlanDocument;
  createdAt: string;
  updatedAt: string;
  version: number;
  isShared: boolean;
  sharedWith: string[];
  collaborators: UserCollaborator[];
}

export interface UserCollaborator {
  userId: string;
  email: string;
  role: 'viewer' | 'editor' | 'admin';
  permissions: string[];
  joinedAt: string;
  lastActive: string;
}

export interface PlanVersion {
  id: string;
  planId: string;
  version: number;
  plan: PlanDocument;
  createdAt: string;
  createdBy: string;
  changeDescription: string;
}

export class MultiUserDataManager {
  private static instance: MultiUserDataManager;
  private userPlans: Map<string, UserPlan> = new Map();
  private planVersions: Map<string, PlanVersion[]> = new Map();
  private userSessions: Map<string, { userId: string; lastActive: string }> = new Map();

  static getInstance(): MultiUserDataManager {
    if (!MultiUserDataManager.instance) {
      MultiUserDataManager.instance = new MultiUserDataManager();
    }
    return MultiUserDataManager.instance;
  }

  // User Plan Management
  async createUserPlan(userId: string, plan: PlanDocument): Promise<UserPlan> {
    const userPlan: UserPlan = {
      id: `plan_${userId}_${Date.now()}`,
      userId,
      plan: { ...plan, ownerId: userId },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      isShared: false,
      sharedWith: [],
      collaborators: []
    };

    this.userPlans.set(userPlan.id, userPlan);
    await this.saveToStorage(userPlan);
    
    return userPlan;
  }

  async getUserPlan(planId: string, userId: string): Promise<UserPlan | null> {
    const userPlan = this.userPlans.get(planId);
    
    if (!userPlan) {
      // Try to load from storage
      const stored = await this.loadFromStorage(planId);
      if (stored && stored.userId === userId) {
        this.userPlans.set(planId, stored);
        return stored;
      }
      return null;
    }

    // Check if user has access
    if (userPlan.userId !== userId && !userPlan.sharedWith.includes(userId)) {
      return null;
    }

    return userPlan;
  }

  async updateUserPlan(planId: string, userId: string, plan: PlanDocument): Promise<UserPlan | null> {
    const userPlan = await this.getUserPlan(planId, userId);
    
    if (!userPlan) {
      throw new Error('Plan not found or access denied');
    }

    // Check if user has edit permissions
    if (userPlan.userId !== userId && !this.hasEditPermission(userPlan, userId)) {
      throw new Error('Insufficient permissions to edit plan');
    }

    // Create new version
    const newVersion: PlanVersion = {
      id: `version_${planId}_${Date.now()}`,
      planId,
      version: userPlan.version + 1,
      plan: { ...plan },
      createdAt: new Date().toISOString(),
      createdBy: userId,
      changeDescription: `Updated by ${userId}`
    };

    // Update plan
    const updatedPlan: UserPlan = {
      ...userPlan,
      plan: { ...plan },
      updatedAt: new Date().toISOString(),
      version: userPlan.version + 1
    };

    this.userPlans.set(planId, updatedPlan);
    
    // Store version
    const versions = this.planVersions.get(planId) || [];
    versions.push(newVersion);
    this.planVersions.set(planId, versions);

    await this.saveToStorage(updatedPlan);
    await this.saveVersionToStorage(newVersion);

    return updatedPlan;
  }

  async deleteUserPlan(planId: string, userId: string): Promise<boolean> {
    const userPlan = await this.getUserPlan(planId, userId);
    
    if (!userPlan || userPlan.userId !== userId) {
      return false;
    }

    this.userPlans.delete(planId);
    this.planVersions.delete(planId);
    
    await this.removeFromStorage(planId);
    
    return true;
  }

  async getUserPlans(userId: string): Promise<UserPlan[]> {
    const userPlans = Array.from(this.userPlans.values())
      .filter(plan => plan.userId === userId || plan.sharedWith.includes(userId));
    
    return userPlans.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  // Collaboration Management
  async sharePlan(planId: string, ownerId: string, collaboratorEmail: string, role: 'viewer' | 'editor' = 'viewer'): Promise<boolean> {
    const userPlan = await this.getUserPlan(planId, ownerId);
    
    if (!userPlan || userPlan.userId !== ownerId) {
      return false;
    }

    const collaborator: UserCollaborator = {
      userId: `user_${Date.now()}`, // In real app, this would be resolved from email
      email: collaboratorEmail,
      role,
      permissions: this.getRolePermissions(role),
      joinedAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };

    userPlan.collaborators.push(collaborator);
    userPlan.sharedWith.push(collaborator.userId);
    userPlan.isShared = true;

    this.userPlans.set(planId, userPlan);
    await this.saveToStorage(userPlan);

    return true;
  }

  async updateCollaboratorRole(planId: string, ownerId: string, collaboratorId: string, newRole: 'viewer' | 'editor' | 'admin'): Promise<boolean> {
    const userPlan = await this.getUserPlan(planId, ownerId);
    
    if (!userPlan || userPlan.userId !== ownerId) {
      return false;
    }

    const collaborator = userPlan.collaborators.find(c => c.userId === collaboratorId);
    if (!collaborator) {
      return false;
    }

    collaborator.role = newRole;
    collaborator.permissions = this.getRolePermissions(newRole);

    this.userPlans.set(planId, userPlan);
    await this.saveToStorage(userPlan);

    return true;
  }

  async removeCollaborator(planId: string, ownerId: string, collaboratorId: string): Promise<boolean> {
    const userPlan = await this.getUserPlan(planId, ownerId);
    
    if (!userPlan || userPlan.userId !== ownerId) {
      return false;
    }

    userPlan.collaborators = userPlan.collaborators.filter(c => c.userId !== collaboratorId);
    userPlan.sharedWith = userPlan.sharedWith.filter(id => id !== collaboratorId);

    this.userPlans.set(planId, userPlan);
    await this.saveToStorage(userPlan);

    return true;
  }

  // Version Management
  async getPlanVersions(planId: string, userId: string): Promise<PlanVersion[]> {
    const userPlan = await this.getUserPlan(planId, userId);
    
    if (!userPlan) {
      return [];
    }

    return this.planVersions.get(planId) || [];
  }

  async restorePlanVersion(planId: string, userId: string, version: number): Promise<UserPlan | null> {
    const userPlan = await this.getUserPlan(planId, userId);
    
    if (!userPlan || userPlan.userId !== userId) {
      return null;
    }

    const versions = this.planVersions.get(planId) || [];
    const targetVersion = versions.find(v => v.version === version);
    
    if (!targetVersion) {
      return null;
    }

    return await this.updateUserPlan(planId, userId, targetVersion.plan);
  }

  // User Session Management
  async createUserSession(userId: string): Promise<string> {
    const sessionId = `session_${userId}_${Date.now()}`;
    this.userSessions.set(sessionId, {
      userId,
      lastActive: new Date().toISOString()
    });
    
    return sessionId;
  }

  async validateUserSession(sessionId: string): Promise<string | null> {
    const session = this.userSessions.get(sessionId);
    
    if (!session) {
      return null;
    }

    // Update last active
    session.lastActive = new Date().toISOString();
    this.userSessions.set(sessionId, session);

    return session.userId;
  }

  // Permission Helpers
  private hasEditPermission(userPlan: UserPlan, userId: string): boolean {
    if (userPlan.userId === userId) {
      return true;
    }

    const collaborator = userPlan.collaborators.find(c => c.userId === userId);
    return collaborator ? ['editor', 'admin'].includes(collaborator.role) : false;
  }

  private getRolePermissions(role: 'viewer' | 'editor' | 'admin'): string[] {
    switch (role) {
      case 'viewer':
        return ['read'];
      case 'editor':
        return ['read', 'write', 'comment'];
      case 'admin':
        return ['read', 'write', 'comment', 'share', 'delete'];
      default:
        return ['read'];
    }
  }

  // Storage Helpers
  private async saveToStorage(userPlan: UserPlan): Promise<void> {
    try {
      const key = `user_plan_${userPlan.id}`;
      localStorage.setItem(key, JSON.stringify(userPlan));
    } catch (error) {
      console.error('Failed to save user plan to storage:', error);
    }
  }

  private async loadFromStorage(planId: string): Promise<UserPlan | null> {
    try {
      const key = `user_plan_${planId}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load user plan from storage:', error);
      return null;
    }
  }

  private async saveVersionToStorage(version: PlanVersion): Promise<void> {
    try {
      const key = `plan_version_${version.planId}_${version.version}`;
      localStorage.setItem(key, JSON.stringify(version));
    } catch (error) {
      console.error('Failed to save plan version to storage:', error);
    }
  }

  private async removeFromStorage(planId: string): Promise<void> {
    try {
      const key = `user_plan_${planId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove user plan from storage:', error);
    }
  }

  // Cleanup expired sessions
  async cleanupExpiredSessions(): Promise<void> {
    const now = new Date();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.userSessions.entries()) {
      const lastActive = new Date(session.lastActive);
      const hoursSinceActive = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceActive > 24) { // 24 hours
        expiredSessions.push(sessionId);
      }
    }

    expiredSessions.forEach(sessionId => {
      this.userSessions.delete(sessionId);
    });
  }
}

// Export singleton instance
export const multiUserDataManager = MultiUserDataManager.getInstance();
