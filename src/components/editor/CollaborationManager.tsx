// ========= PLAN2FUND — COLLABORATION MANAGER =========
// Phase 4: Team editing, advisor integration, version control, and sharing capabilities

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlanDocument } from '@/types/plan';
import { UserProfile } from '@/lib/schemas/userProfile';

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

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: TeamRole;
  permissions: Permission[];
  joinedAt: Date;
  lastActive?: Date;
  isOnline: boolean;
}

interface AdvisorRequest {
  advisorEmail: string;
  advisorName: string;
  specialization: string;
  message: string;
  requestedAt: Date;
}

type TeamRole = 'owner' | 'editor' | 'reviewer' | 'viewer';
type Permission = 'read' | 'write' | 'comment' | 'share' | 'admin';

const PERMISSIONS_BY_ROLE: Record<TeamRole, Permission[]> = {
  owner: ['read', 'write', 'comment', 'share', 'admin'],
  editor: ['read', 'write', 'comment'],
  reviewer: ['read', 'comment'],
  viewer: ['read']
};

export default function CollaborationManager({
  currentPlan,
  currentUser,
  onPlanShare,
  onVersionCreate,
  onVersionRestore,
  onTeamInvite,
  showTeamEditing = true,
  showVersionControl = true,
  showSharing = true,
  showAdvisorIntegration = true
}: CollaborationManagerProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [versions, setVersions] = useState<PlanVersion[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [shareData, setShareData] = useState<Partial<ShareData>>({});
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamRole>('viewer');

  // Load team members and versions (mock data for now)
  useEffect(() => {
    // Mock team members
    setTeamMembers([
      {
        id: '1',
        email: currentUser.id,
        name: currentUser.id,
        role: 'owner',
        permissions: PERMISSIONS_BY_ROLE.owner,
        joinedAt: new Date(),
        isOnline: true
      }
    ]);

    // Mock versions
    setVersions([
      {
        id: 'v1',
        planId: currentPlan.id,
        version: 1,
        createdAt: new Date(Date.now() - 86400000),
        createdBy: currentUser.id,
        changes: ['Initial version'],
        isAutoSave: false
      }
    ]);
  }, [currentPlan.id, currentUser.id]);

  const handleShare = () => {
    if (onPlanShare && shareData.recipientEmail) {
      onPlanShare({
        planId: currentPlan.id,
        recipientEmail: shareData.recipientEmail,
        permissions: shareData.permissions || ['read'],
        expiresAt: shareData.expiresAt,
        message: shareData.message
      });
      setShowShareModal(false);
      setShareData({});
    }
  };

  const handleCreateVersion = () => {
    if (onVersionCreate) {
      const newVersion: PlanVersion = {
        id: `v${versions.length + 1}`,
        planId: currentPlan.id,
        version: versions.length + 1,
        createdAt: new Date(),
        createdBy: currentUser.id,
        changes: ['Manual save'],
        isAutoSave: false
      };
      onVersionCreate(newVersion);
      setVersions([newVersion, ...versions]);
    }
  };

  const handleInviteTeamMember = () => {
    if (onTeamInvite && inviteEmail) {
      onTeamInvite(inviteEmail, inviteRole);
      setInviteEmail('');
      setShowTeamModal(false);
    }
  };


  const getRoleColor = (role: TeamRole) => {
    const colors = {
      owner: 'text-purple-600 bg-purple-50',
      editor: 'text-blue-600 bg-blue-50',
      reviewer: 'text-yellow-600 bg-yellow-50',
      viewer: 'text-gray-600 bg-gray-50'
    };
    return colors[role];
  };

  const getPermissionIcon = (permission: Permission) => {
    const icons = {
      read: '👁️',
      write: '✏️',
      comment: '💬',
      share: '🔗',
      admin: '⚙️'
    };
    return icons[permission];
  };

  return (
    <div className="collaboration-manager p-6 bg-white rounded-lg border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Collaboration & Sharing</h2>
      
      <div className="space-y-6">
        {/* Team Members */}
        {showTeamEditing && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">👥 Team Members</h3>
              <Button
                size="sm"
                onClick={() => setShowTeamModal(true)}
              >
                Invite Member
              </Button>
            </div>
            
            <div className="space-y-2">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      member.isOnline ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                      {member.role}
                    </span>
                    <div className="flex space-x-1">
                      {member.permissions.map((permission) => (
                        <span key={permission} title={permission} className="text-xs">
                          {getPermissionIcon(permission)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Version Control */}
        {showVersionControl && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">📚 Version History</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCreateVersion}
              >
                Create Version
              </Button>
            </div>
            
            <div className="space-y-2">
              {versions.slice(0, 5).map((version) => (
                <div
                  key={version.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Version {version.version}
                      {version.isAutoSave && (
                        <span className="text-xs text-gray-500 ml-2">(Auto-save)</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {version.createdAt.toLocaleString()} • {version.createdBy}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {version.changes.join(', ')}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onVersionRestore?.(version.id)}
                  >
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sharing */}
        {showSharing && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">🔗 Sharing</h3>
              <Button
                size="sm"
                onClick={() => setShowShareModal(true)}
              >
                Share Plan
              </Button>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Share this plan with others</p>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  Copy Link
                </Button>
                <Button size="sm" variant="outline">
                  Export
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Advisor Integration */}
        {showAdvisorIntegration && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">🎓 Advisor Integration</h3>
              <Button
                size="sm"
                onClick={() => console.log('Request advisor review')}
              >
                Request Review
              </Button>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                Get expert feedback from business advisors
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button size="sm" variant="outline">
                  Financial Advisor
                </Button>
                <Button size="sm" variant="outline">
                  Legal Advisor
                </Button>
                <Button size="sm" variant="outline">
                  Marketing Expert
                </Button>
                <Button size="sm" variant="outline">
                  Industry Specialist
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Share Plan</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={shareData.recipientEmail || ''}
                  onChange={(e) => setShareData({...shareData, recipientEmail: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Permissions
                </label>
                <select
                  value={shareData.permissions?.[0] || 'read'}
                  onChange={(e) => setShareData({...shareData, permissions: [e.target.value as Permission]})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="read">View Only</option>
                  <option value="write">Edit</option>
                  <option value="comment">Comment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message (Optional)
                </label>
                <textarea
                  value={shareData.message || ''}
                  onChange={(e) => setShareData({...shareData, message: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  rows={3}
                  placeholder="Add a personal message..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowShareModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleShare}>
                Share
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Team Invite Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Invite Team Member</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as TeamRole)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="viewer">Viewer</option>
                  <option value="reviewer">Reviewer</option>
                  <option value="editor">Editor</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowTeamModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleInviteTeamMember}>
                Send Invite
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
