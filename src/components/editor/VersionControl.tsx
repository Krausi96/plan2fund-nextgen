// ========= PLAN2FUND — VERSION CONTROL =========
// Phase 4: Version history, restore, and sharing capabilities

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlanDocument } from '@/types/plan';
import { UserProfile } from '@/lib/schemas/userProfile';
import { multiUserDataManager } from '@/lib/multiUserDataManager';

interface VersionControlProps {
  currentPlan: PlanDocument;
  currentUser: UserProfile;
  onPlanShare?: (shareData: ShareData) => void;
  onVersionCreate?: (version: PlanVersion) => void;
  onVersionRestore?: (versionId: string) => void;
  showVersionControl?: boolean;
  showSharing?: boolean;
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

type Permission = 'read' | 'write' | 'comment' | 'share' | 'admin';

export default function VersionControl({
  currentPlan,
  currentUser,
  onPlanShare,
  onVersionCreate,
  onVersionRestore,
  showVersionControl = true,
  showSharing = true
}: VersionControlProps) {
  const [versions, setVersions] = useState<PlanVersion[]>([]);
  const [shareData, setShareData] = useState<Partial<ShareData>>({});
  const [showShareModal, setShowShareModal] = useState(false);

  // Load versions on mount
  useEffect(() => {
    const loadVersions = async () => {
      try {
        const planVersions = await multiUserDataManager.getPlanVersions(currentPlan.id, currentUser.id);
        // Convert to local PlanVersion format
        const localVersions: PlanVersion[] = planVersions.map(v => ({
          id: v.id,
          planId: v.planId,
          version: v.version,
          createdAt: new Date(v.createdAt),
          createdBy: v.createdBy,
          changes: [v.changeDescription],
          isAutoSave: false
        }));
        setVersions(localVersions);
      } catch (error) {
        console.error('Failed to load versions:', error);
      }
    };
    
    loadVersions();
  }, [currentPlan.id, currentUser.id]);

  const handleShare = async () => {
    if (shareData.recipientEmail) {
      try {
        // Use the actual multiUserDataManager
        const success = await multiUserDataManager.sharePlan(
          currentPlan.id,
          currentUser.id,
          shareData.recipientEmail,
          shareData.permissions?.[0] as 'viewer' | 'editor' || 'viewer'
        );
        
        if (success) {
          console.log('Plan shared successfully');
          // Call callback if provided
          if (onPlanShare) {
            onPlanShare({
              planId: currentPlan.id,
              recipientEmail: shareData.recipientEmail,
              permissions: shareData.permissions || ['read'],
              expiresAt: shareData.expiresAt,
              message: shareData.message
            });
          }
          setShowShareModal(false);
          setShareData({});
        } else {
          console.error('Failed to share plan');
        }
      } catch (error) {
        console.error('Share error:', error);
        // Fallback to callback if provided
        if (onPlanShare) {
          onPlanShare({
            planId: currentPlan.id,
            recipientEmail: shareData.recipientEmail,
            permissions: shareData.permissions || ['read'],
            expiresAt: shareData.expiresAt,
            message: shareData.message
          });
        }
      }
    }
  };

  const handleCreateVersion = async () => {
    try {
      // Use the actual multiUserDataManager to create version
      const newVersion: PlanVersion = {
        id: `v${versions.length + 1}`,
        planId: currentPlan.id,
        version: versions.length + 1,
        createdAt: new Date(),
        createdBy: currentUser.id,
        changes: ['Manual save'],
        isAutoSave: false
      };
      
      // Store version using the data manager (convert to lib format)
      const libVersion = {
        id: newVersion.id,
        planId: newVersion.planId,
        version: newVersion.version,
        plan: currentPlan,
        createdAt: newVersion.createdAt.toISOString(),
        createdBy: newVersion.createdBy,
        changeDescription: newVersion.changes.join(', ')
      };
      await multiUserDataManager.createPlanVersion(currentPlan.id, currentUser.id, libVersion);
      
      // Update local state
      setVersions([newVersion, ...versions]);
      
      // Call callback if provided
      if (onVersionCreate) {
        onVersionCreate(newVersion);
      }
      
      console.log('Version created successfully');
    } catch (error) {
      console.error('Version creation error:', error);
      // Fallback to callback if provided
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
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    try {
      const version = versions.find(v => v.id === versionId);
      if (version) {
        // Use the actual multiUserDataManager to restore version
        const restoredPlan = await multiUserDataManager.restorePlanVersion(
          currentPlan.id,
          currentUser.id,
          version.version
        );
        
        if (restoredPlan) {
          console.log('Version restored successfully');
          // Call callback if provided
          if (onVersionRestore) {
            onVersionRestore(versionId);
          }
        } else {
          console.error('Failed to restore version');
        }
      }
    } catch (error) {
      console.error('Version restore error:', error);
      // Fallback to callback if provided
      if (onVersionRestore) {
        onVersionRestore(versionId);
      }
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="version-control space-y-6">
      {/* Version History */}
      {showVersionControl && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">📚 Version History</h3>
            <Button
              variant="outline"
              size="sm"
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
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    v{version.version}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      Version {version.version}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(version.createdAt)} • {version.changes.join(', ')}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRestoreVersion(version.id)}
                >
                  Restore
                </Button>
              </div>
            ))}
            
            {versions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No versions created yet</p>
                <p className="text-sm">Create your first version to start tracking changes</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sharing */}
      {showSharing && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">🔗 Share Plan</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShareModal(true)}
            >
              Share
            </Button>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              Share your business plan with stakeholders, investors, or team members for feedback and collaboration.
            </p>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Share Plan</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={shareData.recipientEmail || ''}
                  onChange={(e) => setShareData({...shareData, recipientEmail: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="colleague@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissions
                </label>
                <select
                  value={shareData.permissions?.[0] || 'read'}
                  onChange={(e) => setShareData({...shareData, permissions: [e.target.value as Permission]})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="read">Read-only</option>
                  <option value="write">Can edit</option>
                  <option value="comment">Can comment</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowShareModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleShare}
                disabled={!shareData.recipientEmail}
              >
                Send Share Link
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
