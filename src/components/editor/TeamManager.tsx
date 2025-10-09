// ========= PLAN2FUND — TEAM MANAGER =========
// Phase 4: Team management, invitations, roles, and advisor integration

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlanDocument } from '@/types/plan';
import { UserProfile } from '@/lib/schemas/userProfile';
import { multiUserDataManager } from '@/lib/multiUserDataManager';

interface TeamManagerProps {
  currentPlan: PlanDocument;
  currentUser: UserProfile;
  onTeamInvite?: (email: string, role: TeamRole) => void;
  onAdvisorRequest?: (advisorData: AdvisorRequest) => void;
  showTeamEditing?: boolean;
  showAdvisorIntegration?: boolean;
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
  requestedBy: string;
  requestedAt: Date;
}

type TeamRole = 'owner' | 'editor' | 'reviewer' | 'viewer';
type Permission = 'read' | 'write' | 'comment' | 'share' | 'admin';

export default function TeamManager({
  currentPlan,
  currentUser,
  onTeamInvite,
  onAdvisorRequest,
  showTeamEditing = true,
  showAdvisorIntegration = true
}: TeamManagerProps) {
  const [teamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      email: currentUser.id, // Using ID as fallback
      name: 'You',
      role: 'owner',
      permissions: ['read', 'write', 'comment', 'share', 'admin'],
      joinedAt: new Date(),
      isOnline: true
    }
  ]);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamRole>('viewer');
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showAdvisorModal, setShowAdvisorModal] = useState(false);
  const [advisorData, setAdvisorData] = useState<Partial<AdvisorRequest>>({});

  const handleInviteTeamMember = async () => {
    if (inviteEmail) {
      try {
        // Use the actual multiUserDataManager
        const success = await multiUserDataManager.sharePlan(
          currentPlan.id,
          currentUser.id,
          inviteEmail,
          inviteRole === 'owner' || inviteRole === 'reviewer' ? 'editor' : inviteRole
        );
        
        if (success) {
          console.log('Team member invited successfully');
          // Call callback if provided
          if (onTeamInvite) {
            onTeamInvite(inviteEmail, inviteRole);
          }
          setInviteEmail('');
          setShowTeamModal(false);
        } else {
          console.error('Failed to invite team member');
        }
      } catch (error) {
        console.error('Team invite error:', error);
        // Fallback to callback if provided
        if (onTeamInvite) {
          onTeamInvite(inviteEmail, inviteRole);
        }
      }
    }
  };

  const handleAdvisorRequest = () => {
    if (advisorData.advisorEmail && advisorData.advisorName) {
      const fullAdvisorData: AdvisorRequest = {
        advisorEmail: advisorData.advisorEmail,
        advisorName: advisorData.advisorName,
        specialization: advisorData.specialization || 'General Business',
        message: advisorData.message || 'I would like to request advisor assistance',
        requestedBy: currentUser.id,
        requestedAt: new Date()
      };
      
      if (onAdvisorRequest) {
        onAdvisorRequest(fullAdvisorData);
      }
      setShowAdvisorModal(false);
      setAdvisorData({});
    }
  };

  const getRoleColor = (role: TeamRole) => {
    const colors = {
      owner: 'text-purple-600 bg-purple-50',
      editor: 'text-blue-600 bg-blue-50',
      reviewer: 'text-yellow-600 bg-yellow-50',
      viewer: 'text-gray-600 bg-gray-50'
    };
    return colors[role] || 'text-gray-600 bg-gray-50';
  };

  const getRoleDescription = (role: TeamRole) => {
    const descriptions = {
      owner: 'Full access and control',
      editor: 'Can edit and comment',
      reviewer: 'Can view and comment only',
      viewer: 'Read-only access'
    };
    return descriptions[role] || '';
  };

  return (
    <div className="team-manager space-y-6">
      {/* Team Members */}
      {showTeamEditing && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">👥 Team Members</h3>
            <Button
              variant="outline"
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
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(member.role)}`}>
                    {member.role}
                  </span>
                  {member.isOnline && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advisor Integration */}
      {showAdvisorIntegration && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">🎓 Advisor Network</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvisorModal(true)}
            >
              Request Advisor
            </Button>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              Connect with industry experts and advisors to get professional guidance on your business plan.
            </p>
          </div>
        </div>
      )}

      {/* Team Invite Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Invite Team Member</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="colleague@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as TeamRole)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="viewer">Viewer - Read-only access</option>
                  <option value="reviewer">Reviewer - Can view and comment</option>
                  <option value="editor">Editor - Can edit and comment</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {getRoleDescription(inviteRole)}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowTeamModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleInviteTeamMember}
                disabled={!inviteEmail}
              >
                Send Invite
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Advisor Request Modal */}
      {showAdvisorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Request Advisor</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Advisor Name
                </label>
                <input
                  type="text"
                  value={advisorData.advisorName || ''}
                  onChange={(e) => setAdvisorData({...advisorData, advisorName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Dr. Jane Smith"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={advisorData.advisorEmail || ''}
                  onChange={(e) => setAdvisorData({...advisorData, advisorEmail: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="advisor@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialization
                </label>
                <input
                  type="text"
                  value={advisorData.specialization || ''}
                  onChange={(e) => setAdvisorData({...advisorData, specialization: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Technology, Finance, Marketing, etc."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={advisorData.message || ''}
                  onChange={(e) => setAdvisorData({...advisorData, message: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  rows={3}
                  placeholder="Brief message about what kind of help you need..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowAdvisorModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAdvisorRequest}
                disabled={!advisorData.advisorEmail || !advisorData.advisorName}
              >
                Send Request
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
