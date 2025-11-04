# Configuration Guide

**Date:** 2025-01-27  
**Purpose:** Complete setup instructions for email, payment unlocking, and database integration

---

## 📧 **EMAIL SERVICE CONFIGURATION**

### **Option 1: Resend (Recommended)**

1. **Sign up for Resend:**
   - Go to https://resend.com
   - Create an account
   - Verify your domain

2. **Get API Key:**
   - Go to API Keys section
   - Create a new API key
   - Copy the key (starts with `re_`)

3. **Add to Environment Variables:**
   ```bash
   # .env or .env.local
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
   EMAIL_FROM=Plan2Fund <noreply@plan2fund.com>
   ```

4. **Restart Development Server:**
   ```bash
   npm run dev
   ```

### **Option 2: Generic Email Service**

If you want to use another service (SendGrid, Mailgun, etc.), modify `shared/lib/emailService.ts`:

```typescript
// In sendViaGenericAPI method, add your service:
private async sendViaGenericAPI(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  // Implement your email service here
  const response = await fetch('https://api.yourservice.com/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: options.to,
      subject: options.subject,
      html: options.html
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to send email');
  }
  
  return { success: true };
}
```

### **Testing Email Service**

Emails are automatically logged in development mode. Check console for:
```
📧 Email service not configured - would send: {...}
Email would be sent to: user@example.com
```

---

## 💳 **PAYMENT UNLOCKING**

### **How It Works:**

1. **User completes payment** → Payment record saved to `localStorage.userPayments`
2. **Plan marked as paid** → `plan.isPaid = true` in `localStorage.userPlans`
3. **Export page checks payment** → Uses `getPlanPaymentStatus()` to check if paid
4. **Watermark removed** → If `isPaid = true`, exports without watermark

### **Testing Payment Unlocking:**

1. **Create a test payment:**
   ```javascript
   // In browser console:
   const { savePaymentRecord } = require('./shared/lib/paymentStore');
   savePaymentRecord({
     id: 'test_payment_123',
     userId: 'your-email@example.com',
     planId: 'your-plan-id',
     sessionId: 'test_session',
     amount: 99,
     currency: 'EUR',
     status: 'completed',
     paymentMethod: 'card',
     createdAt: new Date().toISOString(),
     completedAt: new Date().toISOString()
   });
   ```

2. **Check export page:**
   - Go to `/export?planId=your-plan-id`
   - Export should show no watermark if payment exists

---

## 🔐 **ADMIN USER MANAGEMENT**

### **Accessing Admin Panel:**

1. **Login as admin:**
   - Use email containing "admin" (e.g., `admin@plan2fund.com`)
   - OR `kevin@plan2fund.com`
   - OR set `localStorage.setItem('isAdmin', 'true')`

2. **Open Admin Panel:**
   - Go to `/dashboard`
   - Admin panel appears at bottom (orange section)

3. **Manage Admin Users:**
   - Click "Manage Admins" button
   - Add/remove admin users by email
   - Admin users stored in `localStorage.admin_users`

### **Adding Admin Users Programmatically:**

```javascript
// In browser console:
const adminUsers = [
  { id: 'admin@example.com', email: 'admin@example.com', isAdmin: true, createdAt: new Date().toISOString() }
];
localStorage.setItem('admin_users', JSON.stringify(adminUsers));
```

---

## 🗄️ **DATABASE INTEGRATION**

### **Current State:**
- All data stored in `localStorage` (client-side)
- Database layer exists but uses localStorage as fallback
- API endpoints ready for database connection

### **Migration to Real Database:**

#### **Step 1: Choose Database**
- PostgreSQL (recommended for structured data)
- MongoDB (recommended for flexible schema)
- Airtable (for quick setup)

#### **Step 2: Update Environment Variables**
```bash
# .env or .env.local
DATABASE_TYPE=postgresql
DATABASE_URL=postgresql://user:password@localhost:5432/plan2fund
```

#### **Step 3: Implement Database Methods**

Edit `shared/lib/database.ts` and implement methods for your database:

```typescript
// Example for PostgreSQL:
async getUser(userId: string): Promise<any | null> {
  if (this.config.type === 'postgresql') {
    const client = new Client({ connectionString: this.config.connectionString });
    await client.connect();
    const result = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
    await client.end();
    return result.rows[0] || null;
  }
  // ... localStorage fallback
}
```

#### **Step 4: Update API Endpoints**

API endpoints at `/api/database/users.ts` are ready - just ensure database methods are implemented.

---

## 📋 **ENVIRONMENT VARIABLES SUMMARY**

Create `.env.local` file:

```bash
# Email Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=Plan2Fund <noreply@plan2fund.com>

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxx

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database Configuration (Future)
# DATABASE_TYPE=postgresql
# DATABASE_URL=postgresql://user:password@localhost:5432/plan2fund
```

---

## ✅ **VERIFICATION CHECKLIST**

### **Email Service:**
- [ ] `RESEND_API_KEY` set in `.env.local`
- [ ] `EMAIL_FROM` configured
- [ ] Welcome email sent on login
- [ ] Payment confirmation email sent

### **Payment Unlocking:**
- [ ] Payment records saved after checkout
- [ ] Plans marked as paid in dashboard
- [ ] "Unlock Export" button shows for unpaid plans
- [ ] Watermark removed in exports for paid plans

### **Admin Management:**
- [ ] Admin panel visible to admin users
- [ ] Can add/remove admin users
- [ ] Admin users list persisted

### **Database Integration:**
- [ ] Database layer created (`shared/lib/database.ts`)
- [ ] API endpoints ready (`/api/database/users.ts`)
- [ ] Can switch to real database when ready

---

## 🚀 **QUICK START**

1. **Copy `.env.example` to `.env.local`**
2. **Add your Resend API key**
3. **Restart dev server**
4. **Test login** - should send welcome email
5. **Test payment** - complete checkout flow
6. **Check dashboard** - should show payment history
7. **Test admin** - login with admin email

---

## 📝 **NOTES**

- **Email Service:** Works in dev mode (logs to console) without API key
- **Payment Unlocking:** Fully functional with localStorage
- **Admin Management:** Works immediately with localStorage
- **Database:** Can be migrated incrementally - localStorage used as fallback

