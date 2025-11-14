import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { UserPlus, Trash2, Shield, ShieldCheck } from 'lucide-react';
import analytics from '@/shared/user/analytics';

interface AdminUser {
  id: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
}

export default function AdminUserManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAdminUsers();
    }
  }, [isOpen]);

  const loadAdminUsers = () => {
    try {
      const stored = localStorage.getItem('admin_users');
      if (stored) {
        setAdminUsers(JSON.parse(stored));
      } else {
        // Initialize with default admin
        const defaultAdmins: AdminUser[] = [
          { id: 'kevin@plan2fund.com', email: 'kevin@plan2fund.com', isAdmin: true, createdAt: new Date().toISOString() },
          { id: 'admin@plan2fund.com', email: 'admin@plan2fund.com', isAdmin: true, createdAt: new Date().toISOString() }
        ];
        setAdminUsers(defaultAdmins);
        localStorage.setItem('admin_users', JSON.stringify(defaultAdmins));
      }
    } catch (error) {
      console.error('Error loading admin users:', error);
    }
  };

  const handleAddAdmin = () => {
    if (!newAdminEmail.trim() || !newAdminEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      const newAdmin: AdminUser = {
        id: newAdminEmail.toLowerCase().trim(),
        email: newAdminEmail.toLowerCase().trim(),
        isAdmin: true,
        createdAt: new Date().toISOString()
      };

      const updated = [...adminUsers, newAdmin];
      setAdminUsers(updated);
      localStorage.setItem('admin_users', JSON.stringify(updated));
      
      setNewAdminEmail('');
      analytics.trackUserAction('admin_user_added', { email: newAdmin.email });
      
      alert('Admin user added successfully!');
    } catch (error) {
      console.error('Error adding admin user:', error);
      alert('Error adding admin user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAdmin = (userId: string) => {
    if (!confirm('Are you sure you want to remove admin access for this user?')) {
      return;
    }

    try {
      const updated = adminUsers.filter(u => u.id !== userId);
      setAdminUsers(updated);
      localStorage.setItem('admin_users', JSON.stringify(updated));
      
      analytics.trackUserAction('admin_user_removed', { userId });
      alert('Admin access removed');
    } catch (error) {
      console.error('Error removing admin user:', error);
      alert('Error removing admin user');
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Shield className="w-4 h-4" />
        Manage Admins
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Admin User Management
            </DialogTitle>
            <DialogDescription>
              Add or remove admin users. Admin users can access the admin panel in the dashboard.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Add Admin Form */}
            <div className="border rounded-xl p-4 bg-gray-50">
              <div className="flex items-center gap-2 mb-3">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <h3 className="font-medium text-gray-900">Add Admin User</h3>
              </div>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="admin@example.com"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newAdminEmail.trim()) {
                      handleAddAdmin();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={handleAddAdmin}
                  disabled={!newAdminEmail.trim() || isSubmitting}
                >
                  {isSubmitting ? 'Adding...' : 'Add Admin'}
                </Button>
              </div>
            </div>

            {/* Admin Users List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <h3 className="font-medium text-gray-900 mb-2">Current Admin Users</h3>
              {adminUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No admin users</p>
                </div>
              ) : (
                adminUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-xl bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.email}</div>
                        <div className="text-xs text-gray-500">
                          Added {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveAdmin(user.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                      title="Remove admin access"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Info */}
            <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-xl border border-blue-100">
              💡 <strong>Note:</strong> Admin users are determined by email address. Users with emails matching the admin list will automatically have admin access.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

