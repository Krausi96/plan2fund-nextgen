#!/usr/bin/env python3
"""
Execute Phase 1 Implementation - Critical Fixes
Based on User Journey Analysis
"""

import os
import json
from datetime import datetime

def create_implementation_checklist():
    """Create a checklist for Phase 1 implementation"""
    
    checklist = {
        "phase": "Phase 1: Critical Fixes",
        "estimated_time": "1 hour",
        "priority": "HIGH",
        "tasks": [
            {
                "id": "scraper_integration",
                "title": "Fix Scraper Integration",
                "estimated_time": "30 minutes",
                "files_to_modify": [
                    "pages/reco.tsx",
                    "src/lib/dataSource.ts", 
                    "src/contexts/RecommendationContext.tsx"
                ],
                "steps": [
                    "Update pages/reco.tsx to call /api/scraper/run on mount",
                    "Add loading states while scraper runs",
                    "Update dataSource.ts to prioritize scraper data",
                    "Test recommendation flow with real data"
                ],
                "success_criteria": "Recommendation system shows real-time data"
            },
            {
                "id": "payment_form",
                "title": "Add PaymentForm Component", 
                "estimated_time": "30 minutes",
                "files_to_create": [
                    "src/components/pricing/PaymentForm.tsx",
                    "src/components/pricing/PaymentForm.module.css"
                ],
                "files_to_modify": [
                    "pages/checkout.tsx",
                    "pages/api/payments/create-session.ts"
                ],
                "steps": [
                    "Create PaymentForm component with Stripe integration",
                    "Add form validation and error handling", 
                    "Integrate with existing checkout flow",
                    "Test payment process end-to-end"
                ],
                "success_criteria": "Users can complete payment process"
            }
        ],
        "testing_checklist": [
            "Test landing page navigation",
            "Test recommendation flow with real data",
            "Test editor functionality", 
            "Test export process",
            "Test checkout flow with payment",
            "Test complete user journey end-to-end"
        ],
        "rollback_plan": [
            "Keep backup of original files",
            "Test each change incrementally",
            "Have fallback data ready if scraper fails",
            "Ensure payment form has error handling"
        ]
    }
    
    return checklist

def create_file_templates():
    """Create template files for implementation"""
    
    templates = {
        "PaymentForm.tsx": '''import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

interface PaymentFormProps {
  onPaymentSuccess?: (paymentIntent: any) => void;
  onPaymentError?: (error: string) => void;
  amount: number;
  currency?: string;
}

export default function PaymentForm({ 
  onPaymentSuccess, 
  onPaymentError, 
  amount, 
  currency = 'eur' 
}: PaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Create payment session
      const response = await fetch('/api/payments/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency })
      });
      
      const { sessionId } = await response.json();
      
      // Redirect to Stripe Checkout
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
      const { error } = await stripe!.redirectToCheckout({ sessionId });
      
      if (error) {
        throw new Error(error.message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      onPaymentError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-form">
      <h3>Complete Your Payment</h3>
      <p>Amount: €{amount}</p>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <button 
        onClick={handlePayment}
        disabled={loading}
        className="payment-button"
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </div>
  );
}''',
        
        "scraper_integration_example.tsx": '''// Example integration for pages/reco.tsx
import { useEffect, useState } from 'react';
import { useRecommendation } from '@/contexts/RecommendationContext';

export default function RecommendationPage() {
  const [scraperStatus, setScraperStatus] = useState('idle');
  const [scraperData, setScraperData] = useState(null);
  const { recommendations, setRecommendations } = useRecommendation();

  useEffect(() => {
    // Start scraper on component mount
    startScraper();
  }, []);

  const startScraper = async () => {
    setScraperStatus('running');
    
    try {
      // Start scraper
      const runResponse = await fetch('/api/scraper/run', {
        method: 'POST'
      });
      
      if (!runResponse.ok) {
        throw new Error('Failed to start scraper');
      }
      
      // Poll for completion
      const pollStatus = async () => {
        const statusResponse = await fetch('/api/scraper/status');
        const { status, data } = await statusResponse.json();
        
        if (status === 'completed') {
          setScraperData(data);
          setScraperStatus('completed');
          // Update recommendations with real data
          setRecommendations(data.programs);
        } else if (status === 'failed') {
          setScraperStatus('failed');
        } else {
          // Continue polling
          setTimeout(pollStatus, 2000);
        }
      };
      
      pollStatus();
    } catch (error) {
      setScraperStatus('failed');
      console.error('Scraper error:', error);
    }
  };

  return (
    <div>
      {scraperStatus === 'running' && (
        <div>Loading latest funding data...</div>
      )}
      
      {scraperStatus === 'completed' && (
        <div>Real-time data loaded successfully!</div>
      )}
      
      {scraperStatus === 'failed' && (
        <div>Using fallback data...</div>
      )}
      
      {/* Your existing recommendation UI */}
    </div>
  );
}'''
    }
    
    return templates

def main():
    print("🚀 PHASE 1 IMPLEMENTATION CHECKLIST")
    print("=" * 50)
    
    # Create checklist
    checklist = create_implementation_checklist()
    
    # Create templates
    templates = create_file_templates()
    
    # Save checklist
    with open("docs/implementation/phase1_checklist.json", "w") as f:
        json.dump(checklist, f, indent=2)
    
    # Save templates
    with open("docs/implementation/phase1_templates.json", "w") as f:
        json.dump(templates, f, indent=2)
    
    print("✅ Phase 1 Checklist Created")
    print(f"📋 Tasks: {len(checklist['tasks'])}")
    print(f"⏱️  Estimated Time: {checklist['estimated_time']}")
    print(f"🎯 Priority: {checklist['priority']}")
    
    print("\n📋 TASKS TO COMPLETE:")
    for i, task in enumerate(checklist['tasks'], 1):
        print(f"  {i}. {task['title']} ({task['estimated_time']})")
    
    print("\n🧪 TESTING CHECKLIST:")
    for i, test in enumerate(checklist['testing_checklist'], 1):
        print(f"  {i}. {test}")
    
    print(f"\n📄 Checklist saved to: docs/implementation/phase1_checklist.json")
    print(f"📄 Templates saved to: docs/implementation/phase1_templates.json")
    
    print("\n🎯 READY TO START PHASE 1!")
    print("Start with scraper integration, then add PaymentForm component.")

if __name__ == "__main__":
    main()
