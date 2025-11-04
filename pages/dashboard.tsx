import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import Link from "next/link";
import { useUser } from "@/shared/contexts/UserContext";
import { FileText, Target, TrendingUp, Clock, CheckCircle, AlertCircle, Plus, RefreshCw, Database, Settings, Receipt, CreditCard, Download } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import analytics from "@/shared/lib/analytics";
import { withAuth } from "@/shared/lib/withAuth";
import { multiUserDataManager } from "@/shared/lib/multiUserDataManager";
import ClientManager from "@/shared/components/common/ClientManager";
import { getUserPayments, getPlanPaymentStatus } from "@/shared/lib/paymentStore";
import AdminUserManager from "@/shared/components/admin/AdminUserManager";
import { getUserDocuments } from "@/shared/lib/documentStore";

interface Plan {
  id: string;
  userId?: string;
  title: string;
  status: 'draft' | 'in_progress' | 'completed';
  lastModified: string;
  programType: string;
  progress: number;
  isPaid?: boolean;
  paidAt?: string;
}

interface Recommendation {
  id: string;
  userId?: string;
  name: string;
  type: string;
  status: 'pending' | 'applied' | 'rejected' | 'approved';
  amount: string;
  deadline?: string;
}

interface ClientWorkspace {
  id: string;
  name: string;
}

function DashboardPage() {
  const { userProfile, isLoading } = useUser();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [clients, setClients] = useState<ClientWorkspace[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalPlans: 0,
    completedPlans: 0,
    activeRecommendations: 0,
    successRate: 0
  });
  
  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string>('');
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Only run on client side to avoid hydration errors
    if (!isMounted || typeof window === 'undefined') return;
    
    // Load user data from localStorage or API
    loadUserData();
    
    // Check if user is admin (you can customize this logic)
    checkAdminStatus();
    
    // Load last update time
    loadLastUpdateTime();
    
    // Track dashboard view
    analytics.trackPageView('/dashboard', 'Dashboard');
    analytics.trackUserAction('dashboard_viewed', {
      user_type: userProfile?.segment || 'unknown',
      has_plans: plans.length > 0,
      has_recommendations: recommendations.length > 0
    });
  }, [isMounted]);

  const loadUserData = () => {
    // Only access localStorage on client side
    if (typeof window === 'undefined') return;
    
    // Load plans from localStorage - filter by user and client
    const allPlans = JSON.parse(localStorage.getItem('userPlans') || '[]');
    const userPlans = allPlans.filter((p: Plan) => !userProfile || p.userId === userProfile.id);
    setPlans(userPlans);

    // Load recommendations from localStorage - filter by user and client
    const allRecommendations = JSON.parse(localStorage.getItem('userRecommendations') || '[]');
    const userRecommendations = allRecommendations.filter((r: Recommendation) => !userProfile || r.userId === userProfile.id);
    setRecommendations(userRecommendations);

    // Load payments and documents
    if (userProfile) {
      const userPayments = getUserPayments(userProfile.id);
      setPayments(userPayments);
      
      const userDocs = getUserDocuments(userProfile.id);
      setDocuments(userDocs);
      
      // Mark plans as paid if they have completed payments
      userPlans.forEach((plan: Plan) => {
        const paymentStatus = getPlanPaymentStatus(plan.id, userProfile.id);
        if (paymentStatus.isPaid && !plan.isPaid) {
          // Update plan in localStorage
          const allPlans = JSON.parse(localStorage.getItem('userPlans') || '[]');
          const planIndex = allPlans.findIndex((p: Plan) => p.id === plan.id && p.userId === userProfile.id);
          if (planIndex >= 0) {
            allPlans[planIndex] = { ...allPlans[planIndex], isPaid: true, paidAt: paymentStatus.paidAt };
            localStorage.setItem('userPlans', JSON.stringify(allPlans));
            loadUserData(); // Reload to reflect changes
          }
        }
      });
    }

    // Load clients (consultant workspaces) from localStorage
    const savedClients = multiUserDataManager.listClients();
    if (Array.isArray(savedClients) && savedClients.length > 0) {
      setClients(savedClients);
      if (!activeClientId) {
        setActiveClientId(savedClients[0].id);
      }
    }

    // Calculate stats
    const completedPlans = userPlans.filter((plan: Plan) => plan.status === 'completed').length;
    const activeRecommendations = userRecommendations.filter((rec: Recommendation) => rec.status === 'pending' || rec.status === 'applied').length;
    
    setStats({
      totalPlans: userPlans.length,
      completedPlans,
      activeRecommendations,
      successRate: userPlans.length > 0 ? Math.round((completedPlans / userPlans.length) * 100) : 0
    });
  };

  // Only filter plans after mount to avoid hydration mismatch
  const filteredPlans = useMemo(() => {
    if (!isMounted) return [];
    return activeClientId
      ? plans.filter((p: any) => p.clientId === activeClientId)
      : plans;
  }, [plans, activeClientId, isMounted]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'draft': return 'text-gray-600 bg-gray-100';
      case 'applied': return 'text-yellow-600 bg-yellow-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      case 'applied': return <Target className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <AlertCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  // Admin functions
  const checkAdminStatus = () => {
    if (typeof window === 'undefined') {
      setIsAdmin(false);
      return;
    }
    
    if (!userProfile) {
      setIsAdmin(false);
      return;
    }

    // Check admin users list
    try {
      const adminUsers = JSON.parse(localStorage.getItem('admin_users') || '[]');
      const isInAdminList = adminUsers.some((admin: any) => admin.id === userProfile.id || admin.email === userProfile.id);
      
      // Admin check - customizable via:
      // 1. User ID contains 'admin' (e.g., admin@plan2fund.com)
      // 2. Specific admin email addresses
      // 3. Admin users list (from AdminUserManager)
      // 4. localStorage flag (for testing: localStorage.setItem('isAdmin', 'true'))
      const isAdminUser = isInAdminList ||
                         userProfile.id?.includes('admin') || 
                         userProfile.id === 'kevin@plan2fund.com' ||
                         userProfile.id === 'admin@plan2fund.com' ||
                         localStorage.getItem('isAdmin') === 'true';
      setIsAdmin(isAdminUser);
      
      if (isAdminUser) {
        console.log('🔐 Admin access granted for:', userProfile.id);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      // Fallback to simple check
      const isAdminUser = userProfile.id?.includes('admin') || 
                         userProfile.id === 'kevin@plan2fund.com' ||
                         localStorage.getItem('isAdmin') === 'true';
      setIsAdmin(isAdminUser);
    }
  };

  const loadLastUpdateTime = () => {
    if (typeof window === 'undefined') return;
    
    const lastUpdate = localStorage.getItem('lastDataUpdate');
    if (lastUpdate) {
      setLastUpdate(new Date(lastUpdate).toLocaleString());
    }
  };

  const updateData = async () => {
    setIsUpdating(true);
    setUpdateStatus('Starting update...');
    
    try {
      const response = await fetch('/api/scraper/run', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Update completed:', result);
      
      setUpdateStatus('✅ Update completed successfully!');
      setLastUpdate(new Date().toLocaleString());
      localStorage.setItem('lastDataUpdate', new Date().toISOString());
      
      // Track admin action
      analytics.trackUserAction('admin_data_update', {
        success: true,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Update failed:', error);
      setUpdateStatus(`❌ Update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Track admin action
      analytics.trackUserAction('admin_data_update', {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsUpdating(false);
      // Clear status after 5 seconds
      setTimeout(() => setUpdateStatus(''), 5000);
    }
  };

  if (isLoading || !isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
      <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {userProfile?.segment || 'User'}!
            </h1>
            <p className="text-gray-600">
              Here's an overview of your funding journey and business plans.
            </p>
          </div>
          {isMounted && (
            <div className="hidden md:flex items-center gap-3">
              <ClientManager
                clients={clients}
                onClientsChange={(newClients) => {
                  setClients(newClients);
                  if (newClients.length > 0 && !activeClientId) {
                    setActiveClientId(newClients[0].id);
                  }
                }}
                activeClientId={activeClientId}
                onActiveClientChange={(clientId) => {
                  setActiveClientId(clientId);
                  if (clientId) {
                    analytics.trackUserAction('dashboard_client_switched', { clientId });
                  }
                }}
              />
              <Link href="/pricing" onClick={()=>analytics.trackUserAction('dashboard_upgrade_click', {})}>
                <Button variant="outline" size="sm">
                  Upgrade
                </Button>
              </Link>
              <div className="bg-blue-50 px-4 py-2 rounded-lg text-sm text-blue-600 font-medium shadow-sm">My Account</div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {isMounted && (
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-600 mr-4" />
              <div>
                <p className="text-sm text-gray-600">Total Plans</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPlans}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600 mr-4" />
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedPlans}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <Target className="w-8 h-8 text-purple-600 mr-4" />
              <div>
                <p className="text-sm text-gray-600">Active Applications</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeRecommendations}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-orange-600 mr-4" />
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.successRate}%</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {isMounted && (
        <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Plans */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Recent Business Plans</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link href="/reco" onClick={()=>analytics.trackUserAction('dashboard_cta_recommendations', {})}>
                  <Plus className="w-4 h-4 mr-2" />
                  Get Recommendations
                </Link>
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700" asChild>
                <Link href="/editor?product=submission&route=grant" onClick={()=>analytics.trackUserAction('dashboard_cta_new_plan', {})}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Plan
                </Link>
              </Button>
            </div>
          </div>

          {!isMounted || filteredPlans.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No business plans yet</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" asChild>
                  <Link href="/reco">
                    Get Recommendations
                  </Link>
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700" asChild>
                  <Link href="/editor?product=submission&route=grant">
                    Create Your First Plan
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPlans.slice(0, 5).map((plan) => {
                const paymentStatus = userProfile ? getPlanPaymentStatus(plan.id, userProfile.id) : { isPaid: false };
                return (
                  <div key={plan.id} className="flex items-center justify-between p-4 border rounded-xl hover:shadow-md transition-all duration-200 bg-white">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{plan.title}</h3>
                        {paymentStatus.isPaid && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                            ✓ Paid
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{plan.programType} • {plan.lastModified}</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${plan.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex items-center ml-4 gap-2">
                      {!paymentStatus.isPaid && plan.status === 'completed' && (
                        <Button size="sm" variant="outline" className="text-xs" asChild>
                          <Link href={`/checkout?planId=${plan.id}`}>
                            Unlock Export
                          </Link>
                        </Button>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(plan.status)}`}>
                        {getStatusIcon(plan.status)}
                        <span className="ml-1 capitalize">{plan.status.replace('_', ' ')}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

          {/* Active Recommendations */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Active Applications</h2>
              <Button size="sm" variant="outline" asChild>
                <Link href="/reco">
                  Find More
                </Link>
              </Button>
            </div>

            {recommendations.length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No active applications</p>
              <Button className="bg-blue-600 hover:bg-blue-700" asChild>
                <Link href="/reco">
                  Find Funding Opportunities
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.slice(0, 5).map((rec) => (
                <div key={rec.id} className="flex items-center justify-between p-4 border rounded-xl hover:shadow-md transition-all duration-200 bg-white">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{rec.name}</h3>
                    <p className="text-sm text-gray-600">{rec.type} • {rec.amount}</p>
                    {rec.deadline && (
                      <p className="text-xs text-orange-600">Deadline: {rec.deadline}</p>
                    )}
                  </div>
                  <div className="flex items-center ml-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(rec.status)}`}>
                      {getStatusIcon(rec.status)}
                      <span className="ml-1 capitalize">{rec.status}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        </div>
      )}

      {/* Quick Actions */}
      <Card className="p-6 mt-8">
        <h2 className="text-xl font-semibold mb-6">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center" asChild>
            <Link href="/reco" onClick={()=>analytics.trackUserAction('dashboard_quick_find_funding', {})}>
              <Target className="w-6 h-6 mb-2" />
              Find Funding
            </Link>
          </Button>
          <div className="space-y-2">
            <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center" asChild>
              <Link href="/reco" onClick={()=>analytics.trackUserAction('dashboard_quick_get_recommendations', {})}>
                <FileText className="w-6 h-6 mb-2" />
                Get Recommendations
              </Link>
            </Button>
            <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center" asChild>
              <Link href="/editor?product=submission&route=grant" onClick={()=>analytics.trackUserAction('dashboard_quick_create_plan', {})}>
                <FileText className="w-6 h-6 mb-2" />
                Create Plan
              </Link>
            </Button>
          </div>
          <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center" asChild>
            <Link href="/contact">
              <AlertCircle className="w-6 h-6 mb-2" />
              Get Help
            </Link>
          </Button>
        </div>
      </Card>

      {/* My Documents */}
      {isMounted && documents.length > 0 && (
        <Card className="p-6 mt-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <FileText className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold">My Documents</h2>
            </div>
          </div>
          
          <div className="space-y-3">
            {documents.slice(0, 10).map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 border rounded-xl hover:shadow-md transition-all duration-200 bg-white">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{doc.name}</div>
                    <div className="text-sm text-gray-600">
                      {doc.format} • {doc.type === 'plan' ? 'Main Document' : doc.type === 'additional' ? 'Additional' : 'Add-on'} • {typeof window !== 'undefined' ? new Date(doc.exportedAt).toLocaleDateString() : doc.exportedAt.split('T')[0]}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    doc.status === 'email_sent' ? 'bg-green-100 text-green-700' :
                    doc.status === 'downloaded' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {doc.status === 'email_sent' ? 'Email Sent' :
                     doc.status === 'downloaded' ? 'Downloaded' :
                     'Ready'}
                  </span>
                  {doc.downloadUrl && (
                    <a 
                      href={doc.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {documents.length > 10 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Showing 10 of {documents.length} documents
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Payment History */}
      {isMounted && payments.length > 0 && (
        <Card className="p-6 mt-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Receipt className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold">Payment History</h2>
            </div>
          </div>
          
          <div className="space-y-3">
            {payments.slice(0, 10).map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 border rounded-xl hover:shadow-md transition-all duration-200 bg-white">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {payment.planId ? `Plan Export` : 'Payment'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      payment.status === 'completed' ? 'bg-green-100 text-green-700' :
                      payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      payment.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {payment.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {typeof window !== 'undefined' ? new Date(payment.createdAt).toLocaleDateString() : payment.createdAt.split('T')[0]} • {payment.paymentMethod}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{payment.amount} {payment.currency}</p>
                  {payment.completedAt && (
                    <p className="text-xs text-gray-500">{typeof window !== 'undefined' ? new Date(payment.completedAt).toLocaleDateString() : payment.completedAt.split('T')[0]}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Admin Panel - Only visible to admins */}
      {isMounted && isAdmin && (
        <Card className="p-6 mt-8 border-orange-200 bg-orange-50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Settings className="w-6 h-6 text-orange-600 mr-2" />
              <h2 className="text-xl font-semibold text-orange-800">Admin Panel</h2>
            </div>
            <span className="px-2 py-1 bg-orange-200 text-orange-800 text-xs rounded-full">
              Admin Only
            </span>
          </div>
          
          <div className="space-y-4">
            {/* Data Update Section */}
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Database className="w-5 h-5 text-blue-600 mr-2" />
                  <h3 className="font-medium text-gray-900">Funding Data Update</h3>
                </div>
                <Button 
                  onClick={updateData} 
                  disabled={isUpdating}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isUpdating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Update Data
                    </>
                  )}
                </Button>
              </div>
              
              {lastUpdate && (
                <p className="text-sm text-gray-600 mb-2">
                  Last update: {lastUpdate}
                </p>
              )}
              
              {updateStatus && (
                <div className={`text-sm p-2 rounded ${
                  updateStatus.includes('✅') 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {updateStatus}
                </div>
              )}
              
              <p className="text-xs text-gray-500">
                This will scrape all funding websites, categorize data, and update the database.
                Process typically takes 2-5 minutes.
              </p>
            </div>
            
            {/* Admin User Management */}
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Admin Users</h3>
                <AdminUserManager />
              </div>
              <p className="text-xs text-gray-500">
                Manage users who have admin access to this dashboard.
              </p>
            </div>
            
            {/* System Status */}
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-medium text-gray-900 mb-2">System Status</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Pattern Learning:</span>
                  <span className="ml-2 text-green-600 font-medium">Active</span>
                </div>
                <div>
                  <span className="text-gray-600">Categories:</span>
                  <span className="ml-2 text-blue-600 font-medium">18 Active</span>
                </div>
                <div>
                  <span className="text-gray-600">Auto-Update:</span>
                  <span className="ml-2 text-orange-600 font-medium">Manual</span>
                </div>
                <div>
                  <span className="text-gray-600">Data Sources:</span>
                  <span className="ml-2 text-blue-600 font-medium">Austrian/EU</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default withAuth(DashboardPage);
