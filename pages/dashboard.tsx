import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import Link from "next/link";
import { useUser } from "@/shared/user/context/UserContext";
import { FileText, Target, TrendingUp, Clock, CheckCircle, AlertCircle, Plus, Receipt, CreditCard, Download } from "lucide-react";
import { useEffect, useState, useMemo, useCallback } from "react";
import { withAuth } from "@/shared/user/auth/withAuth";
import { multiUserDataManager } from "@/shared/user/storage/planStore";
import analytics from "@/shared/user/analytics";
import ClientManager from "@/shared/user/components/ClientManager";
import { getUserPayments, getPlanPaymentStatus, getUserDocuments } from "@/shared/user/storage/planStore";
import PageEntryIndicator from '@/shared/components/common/PageEntryIndicator';

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
  
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const loadUserData = useCallback(() => {
    if (typeof window === 'undefined') return;

    const syncUserData = () => {
      const allPlans = JSON.parse(localStorage.getItem('userPlans') || '[]');
      const userPlans = allPlans.filter((p: Plan) => !userProfile || p.userId === userProfile.id);
      setPlans(userPlans);

      const allRecommendations = JSON.parse(localStorage.getItem('userRecommendations') || '[]');
      const userRecommendations = allRecommendations.filter((r: Recommendation) => !userProfile || r.userId === userProfile.id);
      setRecommendations(userRecommendations);

      if (userProfile) {
        const userPayments = getUserPayments(userProfile.id);
        setPayments(userPayments);

        const userDocs = getUserDocuments(userProfile.id);
        setDocuments(userDocs);

        userPlans.forEach((plan: Plan) => {
          const paymentStatus = getPlanPaymentStatus(plan.id, userProfile.id);
          if (paymentStatus.isPaid && !plan.isPaid) {
            const storedPlans = JSON.parse(localStorage.getItem('userPlans') || '[]');
            const planIndex = storedPlans.findIndex((p: Plan) => p.id === plan.id && p.userId === userProfile.id);
            if (planIndex >= 0) {
              storedPlans[planIndex] = { ...storedPlans[planIndex], isPaid: true, paidAt: paymentStatus.paidAt };
              localStorage.setItem('userPlans', JSON.stringify(storedPlans));
              syncUserData();
            }
          }
        });
      }

      const savedClients = multiUserDataManager.listClients();
      if (Array.isArray(savedClients) && savedClients.length > 0) {
        setClients(savedClients);
        if (!activeClientId) {
          setActiveClientId(savedClients[0].id);
        }
      }

      const completedPlans = userPlans.filter((plan: Plan) => plan.status === 'completed').length;
      const activeRecommendations = userRecommendations.filter((rec: Recommendation) => rec.status === 'pending' || rec.status === 'applied').length;

      setStats({
        totalPlans: userPlans.length,
        completedPlans,
        activeRecommendations,
        successRate: userPlans.length > 0 ? Math.round((completedPlans / userPlans.length) * 100) : 0
      });
    };

    syncUserData();
  }, [userProfile, activeClientId]);

  useEffect(() => {
    // Only run on client side to avoid hydration errors
    if (!isMounted || typeof window === 'undefined') return;
    
    // Load user data from localStorage or API
    loadUserData();
    
    // Track dashboard view
    analytics.trackPageView('/dashboard', 'Dashboard');
    analytics.trackUserAction('dashboard_viewed', {
      user_type: userProfile?.segment || 'unknown',
      has_plans: plans.length > 0,
      has_recommendations: recommendations.length > 0
    });
  }, [
    isMounted,
    loadUserData,
    userProfile?.segment,
    plans.length,
    recommendations.length
  ]);

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
    <>
      <PageEntryIndicator 
        icon="info"
        translationKey="dashboard"
        duration={0}
      />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Welcome back, {userProfile?.segment || 'User'}!
              </h1>
              <p className="text-gray-600 text-lg">
                Here's an overview of your funding journey and business plans.
              </p>
            </div>
            {isMounted && (
              <div className="flex items-center gap-3 flex-wrap">
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
                <Link href="/checkout/pricing" onClick={()=>analytics.trackUserAction('dashboard_upgrade_click', {})}>
                  <Button variant="outline" size="sm" className="border-gray-300 hover:bg-gray-50">
                    Upgrade
                  </Button>
                </Link>
                <div className="bg-blue-50 px-4 py-2 rounded-lg text-sm text-blue-600 font-medium shadow-sm border border-blue-100">
                  My Account
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {isMounted && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6 bg-blue-50 border border-blue-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 mb-1">Total Plans</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.totalPlans}</p>
                </div>
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-green-50 border border-green-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 mb-1">Completed</p>
                  <p className="text-3xl font-bold text-green-900">{stats.completedPlans}</p>
                </div>
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-purple-50 border border-purple-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 mb-1">Active Applications</p>
                  <p className="text-3xl font-bold text-purple-900">{stats.activeRecommendations}</p>
                </div>
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-orange-50 border border-orange-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700 mb-1">Success Rate</p>
                  <p className="text-3xl font-bold text-orange-900">{stats.successRate}%</p>
                </div>
                <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Main Content - Simplified Layout */}
        {isMounted && (
          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            {/* Quick Actions - Takes 1 column */}
            <Card className="p-6 bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
              <div className="space-y-3">
                <Button 
                  className="w-full justify-start h-auto py-4 bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all" 
                  asChild
                >
                  <Link href="/editor?product=submission&route=grant" onClick={()=>analytics.trackUserAction('dashboard_cta_new_plan', {})}>
                    <Plus className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <div className="font-semibold">Create New Plan</div>
                      <div className="text-xs opacity-90">Start building your business plan</div>
                    </div>
                  </Link>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-auto py-4 border-2 hover:bg-gray-50 transition-all duration-200" 
                  asChild
                >
                  <Link href="/reco" onClick={()=>analytics.trackUserAction('dashboard_cta_recommendations', {})}>
                    <Target className="w-5 h-5 mr-3 text-blue-600" />
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">Find Funding</div>
                      <div className="text-xs text-gray-600">Get personalized recommendations</div>
                    </div>
                  </Link>
                </Button>

                {filteredPlans.length > 0 && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-auto py-3 border border-gray-200 hover:bg-gray-50 transition-all duration-200" 
                    asChild
                  >
                    <Link href="/editor">
                      <FileText className="w-4 h-4 mr-2 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">
                        View All Plans ({filteredPlans.length})
                      </span>
                    </Link>
                  </Button>
                )}
              </div>
            </Card>

            {/* Active Recommendations - Takes 2 columns */}
            <Card className="lg:col-span-2 p-6 bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Active Applications</h2>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/reco">
                    Find More
                  </Link>
                </Button>
              </div>

              {recommendations.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No active applications</h3>
                  <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                    Start finding funding opportunities that match your business needs
                  </p>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm" asChild>
                    <Link href="/reco">
                      Find Funding Opportunities
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendations.slice(0, 5).map((rec) => (
                    <div 
                      key={rec.id} 
                      className="flex items-center justify-between p-5 border-2 border-gray-100 rounded-xl hover:border-purple-200 hover:shadow-md transition-all duration-200 bg-white group"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                            {rec.name}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${getStatusColor(rec.status)}`}>
                            {getStatusIcon(rec.status)}
                            <span className="capitalize">{rec.status}</span>
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{rec.type} • {rec.amount}</p>
                        {rec.deadline && (
                          <p className="text-xs text-orange-600 mt-1 font-medium">
                            ⏰ Deadline: {rec.deadline}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* My Documents */}
        {isMounted && documents.length > 0 && (
          <Card className="p-6 mt-8 bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">My Documents</h2>
              </div>
            </div>
            
            <div className="space-y-3">
              {documents.slice(0, 10).map((doc) => (
                <div 
                  key={doc.id} 
                  className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-md transition-all duration-200 bg-white group"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 mb-1">{doc.name}</div>
                      <div className="text-sm text-gray-600">
                        {doc.format} • {doc.type === 'plan' ? 'Main Document' : doc.type === 'additional' ? 'Additional' : 'Add-on'} • {typeof window !== 'undefined' ? new Date(doc.exportedAt).toLocaleDateString() : doc.exportedAt.split('T')[0]}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
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
                        <Download className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {documents.length > 10 && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Showing 10 of {documents.length} documents
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Payment History */}
        {isMounted && payments.length > 0 && (
          <Card className="p-6 mt-8 bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Payment History</h2>
              </div>
            </div>
            
            <div className="space-y-3">
              {payments.slice(0, 10).map((payment) => (
                <div 
                  key={payment.id} 
                  className="flex items-center justify-between p-5 border-2 border-gray-100 rounded-xl hover:border-green-200 hover:shadow-md transition-all duration-200 bg-white"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold text-gray-900">
                          {payment.planId ? `Plan Export` : 'Payment'}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
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
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-gray-900">{payment.amount} {payment.currency}</p>
                    {payment.completedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        {typeof window !== 'undefined' ? new Date(payment.completedAt).toLocaleDateString() : payment.completedAt.split('T')[0]}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        </div>
      </div>
    </>
  );
}

export default withAuth(DashboardPage);
