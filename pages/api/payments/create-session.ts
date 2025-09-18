// Stripe Checkout Session Creation
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
    const { items, userId, userSegment, successUrl, cancelUrl } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }

    // Create line items for Stripe
    const lineItems = items.map(item => ({
      price_data: {
        currency: item.currency || 'eur',
        product_data: {
          name: item.name,
          description: item.description,
        },
        unit_amount: item.amount * 100, // Convert to cents
      },
      quantity: item.quantity || 1,
    }));

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        userSegment,
        items: JSON.stringify(items)
      },
      customer_email: req.body.customerEmail,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['AT', 'DE', 'CH', 'IT', 'FR', 'ES', 'NL', 'BE', 'LU'],
      },
    });

    return res.status(200).json({
      id: session.id,
      url: session.url,
      amount: items.reduce((sum, item) => sum + (item.amount * item.quantity), 0),
      currency: 'EUR',
      status: 'pending'
    });
  } catch (error) {
    console.error('Error creating Stripe session:', error);
    return res.status(500).json({ error: 'Failed to create payment session' });
  }
}
