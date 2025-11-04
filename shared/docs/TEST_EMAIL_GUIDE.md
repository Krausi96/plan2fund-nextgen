# Test Email Guide

## How to Test Email Functionality

### Option 1: Use the Test Email Page (Recommended)

1. **Navigate to the test email page:**
   ```
   http://localhost:3000/test-email
   ```

2. **Enter your email address** (the email where you want to receive test emails)

3. **Select the email type** you want to test:
   - **Welcome Email**: Sent after user login/signup
   - **Payment Receipt**: Sent after successful payment
   - **Purchase Confirmation**: Sent after purchase completion
   - **Documents Email**: Sent with all exported documents and download links

4. **Click "Send Test Email"** and wait for the result

### Option 2: Test Through Full Flow

1. **Welcome Email**: 
   - Login or signup at `/login`
   - Email is automatically sent after successful authentication

2. **Payment Receipt & Documents Email**:
   - Create a business plan
   - Complete checkout at `/checkout`
   - Email is automatically sent after successful payment

3. **Documents Email**:
   - Export a plan at `/export`
   - Email is automatically sent with download links

## Where Data is Saved

### Email Records
- **Service**: Resend API (external service)
- **Storage**: Resend dashboard (resend.com)
- **Access**: Check your Resend account for delivery logs and email history

### Document Records
- **Storage**: Browser `localStorage` (client-side)
- **Key**: `pf_documents_{userId}`
- **File**: `shared/lib/documentStore.ts`
- **Data Structure**:
  ```typescript
  {
    id: string;
    userId: string;
    planId: string;
    name: string;
    format: 'pdf' | 'docx';
    type: 'plan' | 'additional' | 'addon';
    downloadUrl?: string;
    exportedAt: string;
    status: 'ready' | 'email_sent' | 'downloaded';
  }
  ```
- **View in Dashboard**: Documents appear in "My Documents" section

### Payment Records
- **Storage**: Browser `localStorage` (client-side)
- **Key**: `pf_payments_{userId}`
- **File**: `shared/lib/paymentStore.ts`
- **Data Structure**:
  ```typescript
  {
    id: string;
    userId: string;
    planId?: string;
    amount: string;
    currency: string;
    status: 'pending' | 'completed' | 'failed';
    paymentMethod: string;
    createdAt: string;
    completedAt?: string;
    stripeSessionId?: string;
  }
  ```
- **View in Dashboard**: Payments appear in "Payment History" section

### Plan Records
- **Storage**: Browser `localStorage` (client-side)
- **Key**: `userPlans`
- **File**: `shared/lib/planStore.ts`
- **View in Dashboard**: Plans appear in "Recent Business Plans" section

### Recommendation Records
- **Storage**: Browser `localStorage` (client-side)
- **Key**: `userRecommendations`
- **File**: `shared/lib/planStore.ts`
- **View in Dashboard**: Recommendations appear in "Active Applications" section

## Configuration

### Environment Variables
Make sure these are set in `.env.local`:
```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=Plan2Fund <noreply@plan2fund.com>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Email Service Configuration
- **File**: `shared/lib/emailService.ts`
- **Service**: Resend API (https://resend.com)
- **Fallback**: Logs emails in development mode if API key not set

## Troubleshooting

### Emails Not Sending?
1. Check `RESEND_API_KEY` is set in `.env.local`
2. Verify the API key is valid in Resend dashboard
3. Check browser console for errors
4. Check server logs for API errors
5. Verify email address is valid

### Data Not Showing in Dashboard?
1. Check browser `localStorage` in DevTools (Application tab)
2. Verify data keys match the expected format
3. Ensure user is logged in (userId must match)
4. Check if data is filtered by `activeClientId` (for consultants)

### Testing Email Templates
All email templates are in `shared/lib/emailService.ts`:
- `getWelcomeEmailTemplate()`
- `getPaymentReceiptTemplate()`
- `getPurchaseConfirmationTemplate()`
- `getDocumentsEmailTemplate()`
- `getExportReadyTemplate()`

## API Endpoint

### Test Email API
- **Endpoint**: `/api/test-email`
- **Method**: POST
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "type": "welcome" | "payment-receipt" | "purchase-confirmation" | "documents"
  }
  ```

## Notes

- All data is stored client-side in `localStorage` for now
- In production, consider migrating to a database
- Email delivery depends on Resend API availability
- Documents and payments are filtered by `userId` for privacy

