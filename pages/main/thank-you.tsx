import { Button } from "@/shared/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useI18n } from "@/shared/contexts/I18nContext";
import { useUser } from "@/shared/user/context/UserContext";
import analytics from "@/shared/user/analytics";
import { savePaymentRecord } from "@/shared/user/storage/paymentStore";
import { getUserDocuments } from "@/shared/user/storage/documentStore";
import { FileText, CheckCircle } from "lucide-react";

export default function SuccessHubPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { userProfile } = useUser();
  const { session_id, payment, planId } = router.query;
  const [documents, setDocuments] = useState<any[]>([]);
  const [revisionRequests, setRevisionRequests] = useState<Array<{
    id: number;
    message: string;
    sections: string[];
    timestamp: string;
  }>>([]);
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [revisionMessage, setRevisionMessage] = useState("");
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [_paymentVerified, setPaymentVerified] = useState(false); // Used for future payment verification UI
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Only run on client side to avoid hydration errors
    if (!isMounted || typeof window === 'undefined') return;
    
    analytics.trackPageView('/thank-you', 'Thank You');
    
    // Load documents if planId exists
    if (userProfile && planId && typeof planId === 'string') {
      const userDocs = getUserDocuments(userProfile.id, planId);
      setDocuments(userDocs);
    }
    
    // Verify payment if session_id is present
    if (session_id && typeof session_id === 'string') {
      verifyPayment(session_id);
    } else if (payment === 'success') {
      // Legacy stub payment
      setPaymentVerified(true);
    }
  }, [session_id, payment, planId, userProfile, isMounted]);

  const verifyPayment = async (sessionId: string) => {
    try {
      const response = await fetch('/api/payments/success', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentVerified(true);
        
        // Save payment record to localStorage
        if (data.payment && userProfile) {
          savePaymentRecord(data.payment);
        }
        
        analytics.trackEvent({
          event: 'payment_verified',
          properties: { amount: data.amount, currency: data.currency, planId: data.planId }
        });
      }
    } catch (error) {
      console.error('Payment verification failed:', error);
    }
  };
  if (!isMounted) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8 text-center">
      <div className="flex items-center justify-center gap-3 mb-2">
        <CheckCircle className="w-8 h-8 text-green-600" />
        <h1 className="text-3xl font-bold text-green-600">Success Hub</h1>
      </div>
      <p className="text-gray-600">
        Congratulations! Your business plan order has been successfully
        completed. {documents.length > 0 ? 'Your documents have been sent to your email.' : 'A copy will be sent to your email shortly.'}
      </p>

      {/* Documents List */}
      {documents.length > 0 && (
        <div className="max-w-2xl mx-auto mt-8 text-left">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Your Exported Documents
          </h2>
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-6 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{doc.name}</div>
                    <div className="text-sm text-gray-600">{doc.format} • {doc.type}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    doc.status === 'email_sent' ? 'bg-green-100 text-green-700' :
                    doc.status === 'downloaded' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {doc.status === 'email_sent' ? 'Email Sent' :
                     doc.status === 'downloaded' ? 'Downloaded' :
                     'Ready'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              📧 All documents have been sent to your email. You can also access them anytime from your dashboard.
            </p>
          </div>
        </div>
      )}

      {/* Revision Option */}
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Need adjustments? You can request a free revision within 7 days.
        </p>
        <Button 
          variant="outline"
          onClick={() => setShowRevisionForm(!showRevisionForm)}
        >
          Request Revision
        </Button>
        
        {showRevisionForm && (
          <div className="max-w-md mx-auto p-6 border border-gray-200 rounded-lg bg-white shadow-sm text-left">
            <h3 className="font-semibold mb-4 text-gray-900">Revision Request</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">What needs to be changed?</label>
                <textarea
                  value={revisionMessage}
                  onChange={(e) => setRevisionMessage(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all h-24"
                  placeholder="Describe the changes you'd like..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Sections to revise:</label>
                <div className="space-y-1">
                  {t("thankYou.sections").split(", ").map((section) => (
                    <label key={section} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedSections.includes(section)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSections([...selectedSections, section]);
                          } else {
                            setSelectedSections(selectedSections.filter(s => s !== section));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{section}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Button
                onClick={() => {
                  if (revisionMessage.trim()) {
                    const newRequest = {
                      id: Date.now(),
                      message: revisionMessage,
                      sections: selectedSections,
                      timestamp: new Date().toLocaleString()
                    };
                    setRevisionRequests([newRequest, ...revisionRequests]);
                    setRevisionMessage("");
                    setSelectedSections([]);
                    setShowRevisionForm(false);
                    alert("Revision request noted (demo)");
                  }
                }}
                className="w-full"
              >
                Submit Request
              </Button>
            </div>
          </div>
        )}

        {revisionRequests.length > 0 && (
          <div className="max-w-md mx-auto text-left">
            <h4 className="font-semibold mb-2">Your Revision Requests:</h4>
            <div className="space-y-2">
              {revisionRequests.map((request) => (
                <div key={request.id} className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                  <div className="text-sm text-gray-600 mb-1">{request.timestamp}</div>
                  <div className="text-sm mb-1">{request.message}</div>
                  <div className="text-xs text-gray-500">
                    {t("thankYou.sectionsLabel")}: {request.sections.join(", ") || t("thankYou.allSections")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-center gap-4 mt-6">
        <Button asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/preview">View Your Plan</Link>
        </Button>
      </div>
    </div>
  );
}

