# Vercel Deployment Guide

## 🚀 Quick Deploy to Vercel

### Prerequisites
1. Vercel account
2. GitHub repository connected to Vercel
3. Stripe account (for payments)

### Environment Variables

Set these in your Vercel dashboard under Project Settings > Environment Variables:

```bash
# Required for Stripe payments
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# Optional feature flags
AI_ENABLED=false
```

### Deployment Steps

1. **Connect Repository**
   - Go to Vercel dashboard
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Build Settings**
   - Framework: Next.js (auto-detected)
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Set Environment Variables**
   - Add the environment variables listed above
   - Make sure to use your actual Stripe keys

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

### Post-Deployment Checklist

- [ ] Test homepage loads correctly
- [ ] Test language switching (EN/DE)
- [ ] Test navigation between pages
- [ ] Test contact form submission
- [ ] Test payment flow (if Stripe keys are configured)
- [ ] Check mobile responsiveness
- [ ] Verify SEO meta tags are working

### Known Issues & Solutions

1. **Language Switching Not Working**
   - Issue: i18n configuration conflicts
   - Solution: Test and adjust `next.config.js` i18n settings

2. **Payment Errors**
   - Issue: Missing Stripe environment variables
   - Solution: Add Stripe keys to Vercel environment variables

3. **Build Failures**
   - Issue: TypeScript errors or missing dependencies
   - Solution: Run `npm run build` locally first to catch issues

### Performance Optimizations

The build includes:
- ✅ Static page generation (87 pages)
- ✅ Image optimization (WebP/AVIF)
- ✅ Code splitting
- ✅ Lazy loading
- ✅ Mobile-first responsive design

### SEO Features

- ✅ Hreflang tags for EN/DE
- ✅ Open Graph meta tags
- ✅ Twitter Card meta tags
- ✅ JSON-LD structured data
- ✅ Sitemap.xml
- ✅ Robots.txt

### Support

If you encounter issues:
1. Check Vercel build logs
2. Verify environment variables are set
3. Test locally with `npm run dev`
4. Check browser console for errors
