// ========= PLAN2FUND — COLLABORATION MANAGER =========
// Phase 4: Team editing, advisor integration, version control, and sharing capabilities
// Now uses split components for better maintainability

import React from 'react';
import { PlanDocument } from '@/types/plan';
import { UserProfile } from '@/lib/schemas/userProfile';
import TeamManager from './TeamManager';
import VersionControl from './VersionControl';

interface CollaborationManagerProps {
  currentPlan: PlanDocument;
  currentUser: UserProfile;
  onPlanShare?: (shareData: ShareData) => void;
  onVersionCreate?: (version: PlanVersion) => void;
  onVersionRestore?: (versionId: string) => void;
  onTeamInvite?: (email: string, role: TeamRole) => void;
  onAdvisorRequest?: (advisorData: AdvisorRequest) => void;
  showTeamEditing?: boolean;
  showVersionControl?: boolean;
  showSharing?: boolean;
  showAdvisorIntegration?: boolean;
}

interface ShareData {
  planId: string;
  recipientEmail: string;
  permissions: Permission[];
  expiresAt?: Date;
  message?: string;
}

interface PlanVersion {
  id: string;
  planId: string;
  version: number;
  createdAt: Date;
  createdBy: string;
  changes: string[];
  isAutoSave: boolean;
}

interface AdvisorRequest {
  advisorEmail: string;
  advisorName: string;
  specialization: string;
  message: string;
  requestedBy: string;
  requestedAt: Date;
}

type TeamRole = 'owner' | 'editor' | 'reviewer' | 'viewer';
type Permission = 'read' | 'write' | 'comment' | 'share' | 'admin';

export default function CollaborationManager({
  currentPlan,
  currentUser,
  onPlanShare,
  onVersionCreate,
  onVersionRestore,
  onTeamInvite,
  onAdvisorRequest,
  showTeamEditing = true,
  showVersionControl = true,
  showSharing = true,
  showAdvisorIntegration = true
}: CollaborationManagerProps) {
  return (
    <div className="collaboration-manager p-6 bg-white rounded-lg border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Collaboration & Team</h2>
      
      <div className="space-y-6">
        {/* Team Management */}
        <TeamManager
          currentPlan={currentPlan}
          currentUser={currentUser}
          onTeamInvite={onTeamInvite}
          onAdvisorRequest={onAdvisorRequest}
          showTeamEditing={showTeamEditing}
          showAdvisorIntegration={showAdvisorIntegration}
        />

        {/* Version Control & Sharing */}
        <VersionControl
          currentPlan={currentPlan}
          currentUser={currentUser}
          onPlanShare={onPlanShare}
          onVersionCreate={onVersionCreate}
          onVersionRestore={onVersionRestore}
          showVersionControl={showVersionControl}
          showSharing={showSharing}
        />
      </div>
    </div>
  );
}