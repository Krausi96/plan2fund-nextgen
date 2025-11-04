// Test Email Endpoint - For testing email functionality
import type { NextApiRequest, NextApiResponse } from 'next';
import emailService from '@/shared/lib/emailService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, type } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const testData = {
      userName: 'Test User',
      planName: 'Test Business Plan',
      amount: 99,
      currency: 'EUR',
      orderId: 'test_order_123'
    };

    let result;

    switch (type) {
      case 'welcome':
        result = await emailService.sendWelcomeEmail(email, testData.userName);
        break;
      
      case 'payment-receipt':
        result = await emailService.sendPaymentReceipt(email, testData);
        break;
      
      case 'purchase-confirmation':
        result = await emailService.sendPurchaseConfirmation(email, testData);
        break;
      
      case 'documents':
        result = await emailService.sendDocumentsEmail(email, {
          ...testData,
          documents: [
            {
              name: 'Business Plan',
              downloadUrl: 'https://plan2fund.com/dashboard?download=test1',
              format: 'PDF',
              type: 'plan'
            },
            {
              name: 'Financial Projections',
              downloadUrl: 'https://plan2fund.com/dashboard?download=test2',
              format: 'PDF',
              type: 'additional'
            },
            {
              name: 'One-Pager',
              downloadUrl: 'https://plan2fund.com/dashboard?download=test3',
              format: 'PDF',
              type: 'addon'
            }
          ],
          dashboardUrl: 'https://plan2fund.com/dashboard'
        });
        break;
      
      default:
        return res.status(400).json({ error: 'Invalid email type. Use: welcome, payment-receipt, purchase-confirmation, or documents' });
    }

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: `Test ${type} email sent successfully to ${email}`,
        type
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Failed to send email',
        type
      });
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      type: req.body.type
    });
  }
}

