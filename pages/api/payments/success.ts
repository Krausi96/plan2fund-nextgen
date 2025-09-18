// Stripe Payment Success Handler
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Verify payment was successful
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Extract metadata
    const { userId, items } = session.metadata || {};
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID not found in session' });
    }

    // Create payment record in Airtable
    const paymentRecord = {
      id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      sessionId,
      amount: session.amount_total ? session.amount_total / 100 : 0,
      currency: session.currency || 'EUR',
      status: 'completed',
      paymentMethod: 'card',
      stripePaymentIntentId: session.payment_intent as string,
      items: JSON.stringify(items || []),
      createdAt: new Date().toISOString()
    };

    // Save to Airtable (you would need to create a Payments table)
    // await airtable.createPaymentRecord(paymentRecord);

    return res.status(200).json({
      success: true,
      amount: paymentRecord.amount,
      currency: paymentRecord.currency,
      planId: userId, // This would be the actual plan ID
      paymentMethod: paymentRecord.paymentMethod
    });
  } catch (error) {
    console.error('Error processing payment success:', error);
    return res.status(500).json({ error: 'Failed to process payment success' });
  }
}
