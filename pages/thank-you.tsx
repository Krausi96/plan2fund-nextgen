import { Button } from "@/shared/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useI18n } from "@/shared/contexts/I18nContext";
import analytics from "@/shared/lib/analytics";

export default function SuccessHubPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { session_id, payment } = router.query;
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
  
  useEffect(() => {
    analytics.trackPageView('/thank-you', 'Thank You');
    
    // Verify payment if session_id is present
    if (session_id && typeof session_id === 'string') {
      verifyPayment(session_id);
    } else if (payment === 'success') {
      // Legacy stub payment
      setPaymentVerified(true);
    }
  }, [session_id, payment]);

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
        analytics.trackEvent({
          event: 'payment_verified',
          properties: { amount: data.amount, currency: data.currency }
        });
      }
    } catch (error) {
      console.error('Payment verification failed:', error);
    }
  };
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8 text-center">
      <h1 className="text-3xl font-bold text-green-600">🚀 Success Hub</h1>
      <p className="text-gray-600">
        Congratulations! Your business plan order has been successfully
        completed. A copy has been sent to your email.
      </p>

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
          <div className="max-w-md mx-auto p-4 border rounded-lg bg-gray-50 text-left">
            <h3 className="font-semibold mb-3">Revision Request</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">What needs to be changed?</label>
                <textarea
                  value={revisionMessage}
                  onChange={(e) => setRevisionMessage(e.target.value)}
                  className="w-full border rounded p-2 h-20"
                  placeholder="Describe the changes you'd like..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sections to revise:</label>
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
                <div key={request.id} className="p-3 border rounded bg-white">
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

