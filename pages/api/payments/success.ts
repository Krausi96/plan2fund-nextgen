// Stripe Payment Success Handler
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import emailService from '@/shared/lib/services/emailService';
// Note: documentStore is client-side only (localStorage). Server-side document retrieval
// should be implemented via database or API. For now, document email functionality is disabled.
// import { getUserDocuments, markDocumentEmailSent } from '@/shared/user/storage/planStore';

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

    // Extract plan ID from items if available
    const itemsParsed = typeof items === 'string' ? JSON.parse(items) : items;
    const planId = itemsParsed?.[0]?.planId || session.metadata?.planId;

    // Create payment record
    const paymentRecord = {
      id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      planId: planId || undefined,
      sessionId,
      amount: session.amount_total ? session.amount_total / 100 : 0,
      currency: session.currency || 'EUR',
      status: 'completed' as const,
      paymentMethod: 'card',
      stripePaymentIntentId: session.payment_intent as string,
      items: JSON.stringify(itemsParsed || []),
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };

    // Save payment record (will be saved to database in production)
    // For now, return it so client can save to localStorage
    // TODO: Save to database when database is integrated

    // Send confirmation email
    try {
      const customerEmail = session.customer_email || session.customer_details?.email;
      if (customerEmail) {
        await emailService.sendPaymentReceipt(customerEmail, {
          userName: userId,
          planName: 'Business Plan Export',
          amount: paymentRecord.amount,
          currency: paymentRecord.currency,
          orderId: paymentRecord.id
        });

        // Also send purchase confirmation
        await emailService.sendPurchaseConfirmation(customerEmail, {
          userName: userId,
          planName: 'Business Plan',
          amount: paymentRecord.amount,
          currency: paymentRecord.currency,
          orderId: paymentRecord.id
        });

        // TODO: If planId exists, get exported documents and send them
        // Note: documentStore is client-side only (localStorage). 
        // Server-side document retrieval needs to be implemented via database or API.
        // For now, this functionality is disabled until server-side document storage is implemented.
        // if (planId) {
        //   try {
        //     // TODO: Implement server-side document retrieval
        //     // const documents = await getDocumentsFromDatabase(userId, planId);
        //     // ... send documents email
        //   } catch (docError) {
        //     console.error('Error sending documents email:', docError);
        //   }
        // }
      }
    } catch (emailError) {
      console.error('Error sending payment confirmation email:', emailError);
      // Don't fail the payment if email fails
    }

    return res.status(200).json({
      success: true,
      payment: paymentRecord,
      amount: paymentRecord.amount,
      currency: paymentRecord.currency,
      planId: paymentRecord.planId,
      paymentMethod: paymentRecord.paymentMethod
    });
  } catch (error) {
    console.error('Error processing payment success:', error);
    return res.status(500).json({ error: 'Failed to process payment success' });
  }
}
