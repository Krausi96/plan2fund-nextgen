import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { multiUserDataManager } from '@/shared/lib/multiUserDataManager';
import { Edit2, Trash2, Users } from 'lucide-react';
import analytics from '@/shared/lib/analytics';

interface Client {
  id: string;
  name: string;
}

interface ClientManagerProps {
  clients: Client[];
  onClientsChange: (clients: Client[]) => void;
  activeClientId: string | null;
  onActiveClientChange: (clientId: string | null) => void;
}

export default function ClientManager({ 
  clients, 
  onClientsChange, 
  activeClientId,
  onActiveClientChange 
}: ClientManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientName, setClientName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
    setEditingClient(null);
    setClientName('');
    analytics.trackUserAction('client_manager_opened', {});
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingClient(null);
    setClientName('');
  };

  const handleSave = () => {
    if (!clientName.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingClient) {
        // Update existing client
        const updated = clients.map(c => 
          c.id === editingClient.id ? { ...c, name: clientName.trim() } : c
        );
        updated.forEach(c => multiUserDataManager.saveClient(c));
        onClientsChange(updated);
        analytics.trackUserAction('client_updated', { clientId: editingClient.id });
      } else {
        // Create new client
        const newClient: Client = {
          id: `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: clientName.trim()
        };
        multiUserDataManager.saveClient(newClient);
        const updated = [...clients, newClient];
        onClientsChange(updated);
        
        // Auto-select new client
        onActiveClientChange(newClient.id);
        analytics.trackUserAction('client_created', { clientId: newClient.id });
      }
      handleClose();
    } catch (error) {
      console.error('Error saving client:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setClientName(client.name);
    analytics.trackUserAction('client_edit_started', { clientId: client.id });
  };

  const handleDelete = (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client? This will not delete their plans, but will remove the client workspace.')) {
      return;
    }

    try {
      const updated = clients.filter(c => c.id !== clientId);
      // Note: We're not deleting the client from localStorage here, just removing from list
      // The multiUserDataManager doesn't have a delete method, but we can filter it out
      const allClients = multiUserDataManager.listClients();
      const filtered = allClients.filter(c => c.id !== clientId);
      localStorage.setItem('pf_clients', JSON.stringify(filtered));
      
      onClientsChange(updated);
      
      // If deleted client was active, switch to first remaining client or null
      if (activeClientId === clientId) {
        onActiveClientChange(updated.length > 0 ? updated[0].id : null);
      }
      
      analytics.trackUserAction('client_deleted', { clientId });
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Client Switcher - Workspace-like navigation */}
        {clients.length > 0 && (
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {clients.map((client) => (
              <button
                key={client.id}
                onClick={() => {
                  onActiveClientChange(client.id);
                  analytics.trackUserAction('dashboard_client_switched', { clientId: client.id });
                }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeClientId === client.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                title={client.name}
              >
                <span className="max-w-[120px] truncate">{client.name}</span>
              </button>
            ))}
          </div>
        )}
        
        <Button
          onClick={handleOpen}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Users className="w-4 h-4" />
          <span className="hidden sm:inline">{clients.length > 0 ? 'Manage' : 'Add Client'}</span>
          <span className="sm:hidden">+</span>
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Client Workspaces
            </DialogTitle>
            <DialogDescription>
              Manage your client workspaces. Plans and recommendations are organized by client.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Client List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {clients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No clients yet</p>
                  <p className="text-sm">Add your first client to get started</p>
                </div>
              ) : (
                clients.map((client) => (
                  <div
                    key={client.id}
                    className={`flex items-center justify-between p-4 border rounded-xl transition-all duration-200 ${
                      activeClientId === client.id 
                        ? 'bg-blue-50 border-blue-300 shadow-sm' 
                        : 'bg-white hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{client.name}</div>
                      {activeClientId === client.id && (
                        <div className="text-xs text-blue-600 mt-1">Active</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(client)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:shadow-sm"
                        title="Edit client"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(client.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:shadow-sm"
                        title="Delete client"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add/Edit Form */}
            <div className="border-t pt-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {editingClient ? 'Edit Client Name' : 'New Client Name'}
                  </label>
                  <Input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Enter client name"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && clientName.trim()) {
                        handleSave();
                      }
                    }}
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={!clientName.trim() || isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? 'Saving...' : editingClient ? 'Update Client' : 'Add Client'}
                  </Button>
                  {editingClient && (
                    <Button
                      onClick={handleClose}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="text-xs text-gray-500 bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-100">
              💡 <strong>Tip:</strong> Switch between clients using the workspace tabs in the dashboard header. Each client has their own plans and recommendations.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

