'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Card } from '@/shared/components/ui/card';
import { Mail, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';

export default function TestEmailPage() {
  const router = useRouter();
  const [isDev, setIsDev] = useState(true); // Default to true, will be checked

  // Check if we're in development mode
  useEffect(() => {
    // Client-side check - in production build, this will be false
    const isDevelopment = process.env.NODE_ENV === 'development' || 
                          window.location.hostname === 'localhost' ||
                          window.location.hostname === '127.0.0.1';
    
    setIsDev(isDevelopment);
    
    // In production, redirect to home
    if (!isDevelopment) {
      router.push('/');
    }
  }, [router]);
  const [email, setEmail] = useState('');
  const [emailType, setEmailType] = useState<'welcome' | 'payment-receipt' | 'purchase-confirmation' | 'documents'>('welcome');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  const handleSendTestEmail = async () => {
    if (!email) {
      alert('Please enter an email address');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: emailType })
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send test email'
      });
    } finally {
      setLoading(false);
    }
  };

  // Don't render in production
  if (!isDev) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <Card className="p-6">
          <div className="flex items-center gap-3 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <p>This page is only available in development mode.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Test Email Service</h1>
      <p className="text-gray-600 mb-8">
        Test email functionality without going through the full flow. Make sure your RESEND_API_KEY is configured in .env.local
      </p>

      <Card className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your-email@example.com"
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Type
          </label>
          <select
            value={emailType}
            onChange={(e) => setEmailType(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="welcome">Welcome Email</option>
            <option value="payment-receipt">Payment Receipt</option>
            <option value="purchase-confirmation">Purchase Confirmation</option>
            <option value="documents">Documents Email (with download links)</option>
          </select>
        </div>

        <Button
          onClick={handleSendTestEmail}
          disabled={loading || !email}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="w-4 h-4 mr-2" />
              Send Test Email
            </>
          )}
        </Button>

        {result && (
          <div className={`p-4 rounded-lg border ${
            result.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <div>
                {result.success ? (
                  <p className="text-green-800 font-medium">{result.message}</p>
                ) : (
                  <p className="text-red-800 font-medium">{result.error || 'Failed to send email'}</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">📧 Email Types:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li><strong>Welcome Email:</strong> Sent after user login/signup</li>
            <li><strong>Payment Receipt:</strong> Sent after successful payment</li>
            <li><strong>Purchase Confirmation:</strong> Sent after purchase completion</li>
            <li><strong>Documents Email:</strong> Sent with all exported documents and download links</li>
          </ul>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> If emails aren't sending, check:
          </p>
          <ul className="text-sm text-yellow-800 mt-2 space-y-1 list-disc list-inside">
            <li>RESEND_API_KEY is set in .env.local</li>
            <li>Email service is properly configured</li>
            <li>Check browser console for errors</li>
            <li>Check server logs for API errors</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

