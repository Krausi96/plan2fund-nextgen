# Freemium Pricing Model

**Last Updated:** 2025-01-XX  
**Status:** Defined and Implemented

---

## 📊 Pricing Tiers

### Free Tier
**Price:** €0/month  
**Target:** Individual entrepreneurs, students, early-stage startups

**Features:**
- ✅ Basic business plan editor
- ✅ Image upload (unlimited)
- ✅ Create unlimited business plans
- ✅ Basic compliance checking
- ✅ Program discovery (rule-based matching only)
- ✅ Basic AI assistance (limited)

**Limitations:**
- ❌ No semantic search
- ❌ No advanced AI features
- ❌ No PDF export (watermarked)
- ❌ No additional documents editor
- ❌ No priority support

---

### Premium Tier
**Price:** €29/month or €290/year (save 17%)  
**Target:** Serious entrepreneurs, consultants, growing startups

**Features:**
- ✅ Everything in Free tier
- ✅ **Semantic search** - AI-powered program matching by project description
- ✅ **Advanced AI Assistant** - Enhanced context-aware suggestions
- ✅ **PDF Export** - Professional PDF export without watermark
- ✅ **Additional Documents** - Pitch decks, application forms, work plans
- ✅ **LLM Data Extraction** - Advanced AI extraction for program data
- ✅ Email support (48-hour response)

**Value Proposition:**
- Save time with AI-powered matching and content generation
- Professional document export for submissions
- Complete application package (business plan + additional documents)

---

### Enterprise Tier
**Price:** Custom pricing (contact sales)  
**Target:** Agencies, consultancies, large organizations

**Features:**
- ✅ Everything in Premium tier
- ✅ **Priority Support** - 24-hour response time, dedicated account manager
- ✅ **Unlimited Plans** - No limits on number of plans
- ✅ **Team Collaboration** - Multiple users, shared templates
- ✅ **Custom Templates** - Program-specific templates for your clients
- ✅ **API Access** - Integrate Plan2Fund into your workflow
- ✅ **White-label Option** - Brand Plan2Fund as your own
- ✅ **Analytics Dashboard** - Track usage, success rates, client metrics

**Value Proposition:**
- Scale your consulting business
- Professional client deliverables
- Custom integrations and branding

---

## 🎯 Feature Comparison Matrix

| Feature | Free | Premium | Enterprise |
|---------|------|---------|------------|
| **Business Plan Editor** | ✅ | ✅ | ✅ |
| **Image Upload** | ✅ | ✅ | ✅ |
| **Unlimited Plans** | ✅ | ✅ | ✅ |
| **Basic Compliance** | ✅ | ✅ | ✅ |
| **Rule-based Matching** | ✅ | ✅ | ✅ |
| **Semantic Search** | ❌ | ✅ | ✅ |
| **Advanced AI** | ❌ | ✅ | ✅ |
| **PDF Export** | ❌ (watermarked) | ✅ | ✅ |
| **Additional Documents** | ❌ | ✅ | ✅ |
| **LLM Extraction** | ❌ | ✅ | ✅ |
| **Priority Support** | ❌ | ❌ | ✅ |
| **Team Collaboration** | ❌ | ❌ | ✅ |
| **Custom Templates** | ❌ | ❌ | ✅ |
| **API Access** | ❌ | ❌ | ✅ |
| **White-label** | ❌ | ❌ | ✅ |
| **Analytics** | ❌ | ❌ | ✅ |

---

## 💰 Revenue Model

### Free Tier
- **Purpose:** User acquisition, product discovery
- **Monetization:** None (loss leader)
- **Conversion Target:** 5-10% to Premium

### Premium Tier
- **Purpose:** Primary revenue source
- **Monthly Recurring Revenue (MRR):** €29/user
- **Annual Recurring Revenue (ARR):** €290/user
- **Target:** 10-15% of user base

### Enterprise Tier
- **Purpose:** High-value accounts, B2B sales
- **Pricing:** Custom (typically €500-5000/month)
- **Target:** 1-2% of user base, 20-30% of revenue

---

## 🚀 Upgrade Paths

### Free → Premium
**Triggers:**
- User tries to use semantic search
- User tries to export PDF
- User tries to create additional documents
- User requests advanced AI features

**Incentives:**
- 14-day free trial of Premium features
- "Upgrade to unlock" modals with clear value proposition
- Success stories and testimonials

### Premium → Enterprise
**Triggers:**
- User creates >10 plans/month
- User requests team features
- User asks about API access
- User mentions multiple clients

**Incentives:**
- Custom pricing based on usage
- Dedicated account manager
- Priority onboarding

---

## 📈 Pricing Strategy

### Positioning
- **Free:** "Try before you buy" - Full feature access with limitations
- **Premium:** "Professional tools for serious entrepreneurs" - €29/month
- **Enterprise:** "Scale your consulting business" - Custom pricing

### Competitive Analysis
- **ChatGPT Plus:** €20/month (general purpose, no funding focus)
- **LivePlan:** €19.95/month (generic business plans, no program matching)
- **Notion AI:** €10/month (general purpose, no funding focus)

**Our Advantage:**
- Specialized for Austrian/EU funding
- Program-specific templates and compliance
- End-to-end workflow (discovery → matching → creation → validation)
- Up-to-date program data from 32+ institutions

---

## 🔒 Feature Gating Implementation

**Location:** `shared/lib/featureFlags.ts`

**How it works:**
1. User subscription tier stored in user profile
2. `isFeatureEnabled(feature, subscriptionTier)` checks access
3. Components show upgrade modals for premium features
4. API routes validate subscription tier

**Example:**
```typescript
if (!isFeatureEnabled('semantic_search', subscriptionTier)) {
  setUpgradeFeature('semantic_search');
  setShowUpgradeModal(true);
  return;
}
```

---

## 📝 Notes

- **Free tier is generous** - Most users can create complete business plans
- **Premium tier focuses on AI and convenience** - Time-saving features
- **Enterprise tier is for scale** - Team features and customization
- **Pricing is competitive** - Lower than generic tools, specialized value
- **Conversion optimization** - Clear upgrade prompts, trial periods

---

## 🎯 Success Metrics

### Free Tier
- User acquisition rate
- Feature usage (which free features are most used)
- Conversion rate to Premium (target: 5-10%)

### Premium Tier
- Monthly churn rate (target: <5%)
- Average revenue per user (ARPU)
- Feature adoption (which premium features drive value)

### Enterprise Tier
- Number of enterprise accounts
- Average contract value (ACV)
- Customer lifetime value (LTV)
- Net revenue retention (NRR)

---

**Ready for implementation!** 🚀


