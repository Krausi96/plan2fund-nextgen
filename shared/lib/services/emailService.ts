// Email Service for sending notifications
// Can be configured to use Resend, SendGrid, Nodemailer, or similar services

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface EmailTemplateData {
  userName?: string;
  planName?: string;
  amount?: number;
  currency?: string;
  downloadUrl?: string;
  orderId?: string;
}

class EmailService {
  private isEnabled: boolean;
  private apiKey?: string;

  constructor() {
    // Check if email service is configured
    this.isEnabled = !!process.env.EMAIL_SERVICE_API_KEY || !!process.env.RESEND_API_KEY;
    this.apiKey = process.env.EMAIL_SERVICE_API_KEY || process.env.RESEND_API_KEY;
  }

  /**
   * Send email via configured service
   */
  async sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    if (!this.isEnabled) {
      console.log('📧 Email service not configured - would send:', options);
      // In development/test mode, just log the email
      if (process.env.NODE_ENV === 'development') {
        console.log('Email would be sent to:', options.to);
        console.log('Subject:', options.subject);
        console.log('HTML:', options.html);
      }
      return { success: true }; // Return success in dev mode
    }

    try {
      // Try Resend API first (recommended)
      if (process.env.RESEND_API_KEY) {
        return await this.sendViaResend(options);
      }

      // Fallback to generic email API
      return await this.sendViaGenericAPI();
    } catch (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async sendViaResend(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'Plan2Fund <noreply@plan2fund.com>',
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text || options.html.replace(/<[^>]*>/g, ''),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send email');
      }

      return { success: true };
    } catch (error) {
      console.error('Resend API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email'
      };
    }
  }

  private async sendViaGenericAPI(): Promise<{ success: boolean; error?: string }> {
    // Generic implementation - can be customized for other email services
    console.warn('Generic email API not implemented. Please configure Resend or another email service.');
    return { success: false, error: 'Email service not configured' };
  }

  /**
   * Send welcome email after signup
   */
  async sendWelcomeEmail(email: string, userName?: string): Promise<{ success: boolean }> {
    const html = this.getWelcomeEmailTemplate(userName);
    return await this.sendEmail({
      to: email,
      subject: 'Welcome to Plan2Fund! 🚀',
      html,
    });
  }

  /**
   * Send plan purchase confirmation email
   */
  async sendPurchaseConfirmation(
    email: string,
    data: EmailTemplateData
  ): Promise<{ success: boolean }> {
    const html = this.getPurchaseConfirmationTemplate(data);
    return await this.sendEmail({
      to: email,
      subject: `Your Business Plan is Ready! 📄`,
      html,
    });
  }

  /**
   * Send export ready notification with document links
   */
  async sendExportReady(
    email: string,
    data: EmailTemplateData & { documents?: Array<{ name: string; downloadUrl?: string; format: string }> }
  ): Promise<{ success: boolean }> {
    const html = this.getExportReadyTemplate(data);
    return await this.sendEmail({
      to: email,
      subject: `Your Business Plan Export is Ready 📥`,
      html,
    });
  }

  /**
   * Send documents email after payment/export
   */
  async sendDocumentsEmail(
    email: string,
    data: EmailTemplateData & { 
      documents: Array<{ name: string; downloadUrl?: string; format: string; type: string }>;
      dashboardUrl?: string;
    }
  ): Promise<{ success: boolean }> {
    const html = this.getDocumentsEmailTemplate(data);
    return await this.sendEmail({
      to: email,
      subject: `Your Business Plan Documents 📄`,
      html,
    });
  }

  /**
   * Send payment receipt
   */
  async sendPaymentReceipt(
    email: string,
    data: EmailTemplateData
  ): Promise<{ success: boolean }> {
    const html = this.getPaymentReceiptTemplate(data);
    return await this.sendEmail({
      to: email,
      subject: `Payment Receipt - Plan2Fund`,
      html,
    });
  }

  // Email Templates
  private getWelcomeEmailTemplate(userName?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 24px; background: #3B82F6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Plan2Fund! 🚀</h1>
          </div>
          <div class="content">
            <p>Hi ${userName || 'there'},</p>
            <p>Thank you for joining Plan2Fund! We're excited to help you create your business plan and find the perfect funding opportunities.</p>
            <p>Get started by:</p>
            <ul>
              <li>Completing our smart wizard to find funding programs</li>
              <li>Creating your business plan with our AI-powered editor</li>
              <li>Exporting and applying for funding</li>
            </ul>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://plan2fund.com'}/app/user/dashboard" class="button">Go to Dashboard</a>
            <p>If you have any questions, feel free to reach out!</p>
            <p>Best regards,<br>The Plan2Fund Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getPurchaseConfirmationTemplate(data: EmailTemplateData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 24px; background: #10B981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .order-details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Business Plan is Ready! 📄</h1>
          </div>
          <div class="content">
            <p>Hi ${data.userName || 'there'},</p>
            <p>Great news! Your business plan "${data.planName || 'Business Plan'}" has been successfully processed.</p>
            <div class="order-details">
              <h3>Order Details</h3>
              <p><strong>Plan:</strong> ${data.planName || 'Business Plan'}</p>
              ${data.amount ? `<p><strong>Amount:</strong> ${data.amount} ${data.currency || 'EUR'}</p>` : ''}
              ${data.orderId ? `<p><strong>Order ID:</strong> ${data.orderId}</p>` : ''}
            </div>
            ${data.downloadUrl ? `<a href="${data.downloadUrl}" class="button">Download Your Plan</a>` : ''}
            <p>You can also access your plan anytime from your dashboard.</p>
            <p>Best regards,<br>The Plan2Fund Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getExportReadyTemplate(data: EmailTemplateData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 24px; background: #3B82F6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Export is Ready! 📥</h1>
          </div>
          <div class="content">
            <p>Hi ${data.userName || 'there'},</p>
            <p>Your business plan export for "${data.planName || 'Business Plan'}" is ready!</p>
            ${data.downloadUrl ? `<a href="${data.downloadUrl}" class="button">Download Export</a>` : ''}
            <p>You can also access your exports from your dashboard.</p>
            <p>Best regards,<br>The Plan2Fund Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getDocumentsEmailTemplate(data: EmailTemplateData & { 
    documents: Array<{ name: string; downloadUrl?: string; format: string; type: string }>;
    dashboardUrl?: string;
  }): string {
    const documentsList = data.documents.map(doc => `
      <li style="margin: 12px 0; padding: 12px; background: #f9fafb; border-radius: 6px;">
        <div style="display: flex; justify-between; align-items: center;">
          <div>
            <strong style="color: #1f2937;">${doc.name}</strong>
            <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
              ${doc.format} • ${doc.type === 'plan' ? 'Main Document' : doc.type === 'additional' ? 'Additional Document' : 'Add-on'}
            </div>
          </div>
          ${doc.downloadUrl ? `
            <a href="${doc.downloadUrl}" style="padding: 8px 16px; background: #3B82F6; color: white; text-decoration: none; border-radius: 6px; font-size: 14px;">
              Download
            </a>
          ` : ''}
        </div>
      </li>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 24px; background: #3B82F6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .documents-list { list-style: none; padding: 0; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Business Plan Documents 📄</h1>
          </div>
          <div class="content">
            <p>Hi ${data.userName || 'there'},</p>
            <p>Your business plan "${data.planName || 'Business Plan'}" has been exported and is ready for download!</p>
            
            <h3 style="color: #1f2937; margin-top: 24px;">Your Documents:</h3>
            <ul class="documents-list">
              ${documentsList}
            </ul>
            
            <p style="margin-top: 24px;">All your documents are also available in your dashboard for easy access anytime.</p>
            
            ${data.dashboardUrl ? `
              <a href="${data.dashboardUrl}" class="button">View in Dashboard</a>
            ` : ''}
            
            <p style="margin-top: 24px; font-size: 12px; color: #6b7280;">
              💡 Tip: Keep these documents safe. You can access them anytime from your dashboard.
            </p>
            
            <p>Best regards,<br>The Plan2Fund Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getPaymentReceiptTemplate(data: EmailTemplateData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .receipt { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border: 2px solid #10B981; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Receipt ✅</h1>
          </div>
          <div class="content">
            <p>Hi ${data.userName || 'there'},</p>
            <p>Thank you for your purchase! Here's your receipt:</p>
            <div class="receipt">
              <h3>Receipt</h3>
              <p><strong>Order ID:</strong> ${data.orderId || 'N/A'}</p>
              <p><strong>Item:</strong> ${data.planName || 'Business Plan Export'}</p>
              ${data.amount ? `<p><strong>Amount:</strong> ${data.amount} ${data.currency || 'EUR'}</p>` : ''}
              <p><strong>Status:</strong> Paid</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            <p>This receipt has been saved to your account. You can access it anytime from your dashboard.</p>
            <p>Best regards,<br>The Plan2Fund Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();
export default emailService;

