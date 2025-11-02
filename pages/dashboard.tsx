import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import Link from "next/link";
import { useUser } from "@/shared/contexts/UserContext";
import { FileText, Target, TrendingUp, Clock, CheckCircle, AlertCircle, Plus, RefreshCw, Database, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import analytics from "@/shared/lib/analytics";

interface Plan {
  id: string;
  title: string;
  status: 'draft' | 'in_progress' | 'completed';
  lastModified: string;
  programType: string;
  progress: number;
}

interface Recommendation {
  id: string;
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

export default function DashboardPage() {
  const { userProfile, isLoading } = useUser();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [clients, setClients] = useState<ClientWorkspace[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
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

  useEffect(() => {
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
  }, []);

  const loadUserData = () => {
    // Load plans from localStorage
    const savedPlans = JSON.parse(localStorage.getItem('userPlans') || '[]');
    setPlans(savedPlans);

    // Load recommendations from localStorage
    const savedRecommendations = JSON.parse(localStorage.getItem('userRecommendations') || '[]');
    setRecommendations(savedRecommendations);

    // Load clients (consultant workspaces) from localStorage
    const savedClients = JSON.parse(localStorage.getItem('pf_clients') || '[]');
    if (Array.isArray(savedClients) && savedClients.length > 0) {
      setClients(savedClients);
      setActiveClientId(savedClients[0].id);
    }

    // Calculate stats
    const completedPlans = savedPlans.filter((plan: Plan) => plan.status === 'completed').length;
    const activeRecommendations = savedRecommendations.filter((rec: Recommendation) => rec.status === 'pending' || rec.status === 'applied').length;
    
    setStats({
      totalPlans: savedPlans.length,
      completedPlans,
      activeRecommendations,
      successRate: savedPlans.length > 0 ? Math.round((completedPlans / savedPlans.length) * 100) : 0
    });
  };

  const filteredPlans = activeClientId
    ? plans.filter((p: any) => p.clientId === activeClientId)
    : plans;

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
    // Simple admin check - you can customize this
    // For now, check if user ID contains 'admin' or specific admin ID
    const isAdminUser = userProfile?.id?.includes('admin') || 
                       userProfile?.id === 'kevin@plan2fund.com' ||
                       localStorage.getItem('isAdmin') === 'true';
    setIsAdmin(isAdminUser);
  };

  const loadLastUpdateTime = () => {
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

  if (isLoading) {
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
          <div className="hidden md:flex items-center gap-3">
            {clients.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Client:</span>
                <select
                  className="px-2 py-1 border rounded text-sm"
                  value={activeClientId || ''}
                  onChange={(e)=>{
                    setActiveClientId(e.target.value || null);
                    analytics.trackUserAction('dashboard_client_switched', { clientId: e.target.value });
                  }}
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
            <Link href="/pricing" onClick={()=>analytics.trackUserAction('dashboard_upgrade_click', {})}>
              <div className="px-4 py-2 rounded-lg text-sm font-medium border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors">
                Upgrade
              </div>
            </Link>
            <div className="bg-blue-50 px-4 py-2 rounded-lg text-sm text-blue-600 font-medium">My Account</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
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

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Plans */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Recent Business Plans</h2>
            <div className="flex gap-2">
              <Link href="/reco" onClick={()=>analytics.trackUserAction('dashboard_cta_recommendations', {})}>
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Get Recommendations
                </Button>
              </Link>
              <Link href="/editor?product=submission&route=grant" onClick={()=>analytics.trackUserAction('dashboard_cta_new_plan', {})}>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Plan
                </Button>
              </Link>
            </div>
          </div>

          {filteredPlans.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No business plans yet</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Link href="/reco">
                  <Button variant="outline">
                    Get Recommendations
                  </Button>
                </Link>
                <Link href="/editor?product=submission&route=grant">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Create Your First Plan
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPlans.slice(0, 5).map((plan) => (
                <div key={plan.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{plan.title}</h3>
                    <p className="text-sm text-gray-600">{plan.programType} • {plan.lastModified}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${plan.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex items-center ml-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(plan.status)}`}>
                      {getStatusIcon(plan.status)}
                      <span className="ml-1 capitalize">{plan.status.replace('_', ' ')}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Active Recommendations */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Active Applications</h2>
            <Link href="/reco">
              <Button size="sm" variant="outline">
                Find More
              </Button>
            </Link>
          </div>

          {recommendations.length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No active applications</p>
              <Link href="/reco">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Find Funding Opportunities
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.slice(0, 5).map((rec) => (
                <div key={rec.id} className="flex items-center justify-between p-4 border rounded-lg">
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

      {/* Quick Actions */}
      <Card className="p-6 mt-8">
        <h2 className="text-xl font-semibold mb-6">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Link href="/reco" onClick={()=>analytics.trackUserAction('dashboard_quick_find_funding', {})}>
            <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
              <Target className="w-6 h-6 mb-2" />
              Find Funding
            </Button>
          </Link>
          <div className="space-y-2">
            <Link href="/reco" onClick={()=>analytics.trackUserAction('dashboard_quick_get_recommendations', {})}>
              <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center">
                <FileText className="w-6 h-6 mb-2" />
                Get Recommendations
              </Button>
            </Link>
            <Link href="/editor?product=submission&route=grant" onClick={()=>analytics.trackUserAction('dashboard_quick_create_plan', {})}>
              <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center">
                <FileText className="w-6 h-6 mb-2" />
                Create Plan
              </Button>
            </Link>
          </div>
          <Link href="/contact">
            <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
              <AlertCircle className="w-6 h-6 mb-2" />
              Get Help
            </Button>
          </Link>
        </div>
      </Card>

      {/* Admin Panel - Only visible to admins */}
      {isAdmin && (
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
