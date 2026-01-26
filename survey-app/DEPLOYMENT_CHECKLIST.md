# Unboring Surveys - Deployment Checklist

A comprehensive checklist for deploying the Unboring Surveys application to production.

---

## Pre-Deployment

### 1. Environment Variables

Create these environment variables in your hosting platform (Vercel, Netlify, etc.):

#### Firebase (Required)
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_SERVICE_ACCOUNT_KEY=  # JSON string for server-side operations
```

#### Stripe (Required for payments)
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... (or pk_live_... for production)
STRIPE_SECRET_KEY=sk_test_... (or sk_live_... for production)
STRIPE_WEBHOOK_SECRET=whsec_... (from Stripe webhook setup)
```
Note: Pricing is defined in code (`lib/types/index.ts`), not in Stripe dashboard. No price IDs needed.

#### AI Features (Optional - for question suggestions)
```
ANTHROPIC_API_KEY=
```

#### App Configuration
```
NEXT_PUBLIC_APP_URL=https://unboringsurveys.com
```

---

## Firebase Setup

### 2. Firestore Database

- [ ] Create Firestore database in your Firebase project
- [ ] Set database location (choose closest to your users)
- [ ] Deploy Firestore security rules (see `firestore.rules`)
- [ ] Create required composite indexes:
  - Collection: `surveys` - Fields: `userId` (ASC), `createdAt` (DESC)
  - Collection: `responses` - Fields: `surveyId` (ASC), `completedAt` (DESC)
  - Collection: `partialResponses` - Fields: `surveyId` (ASC), `sessionId` (ASC)

### 3. Firebase Authentication

- [ ] Enable Google Sign-in provider
- [ ] Add your production domain to authorized domains
- [ ] Configure OAuth consent screen if needed

### 4. Firebase Budget Alerts

Set up spending notifications to avoid unexpected bills:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your Firebase project
3. Navigate to **Billing** > **Budgets & alerts**
4. Click **Create Budget**
5. Configure:
   - **Budget name**: "Firebase Daily Alert"
   - **Budget amount**: $5/day or $150/month (adjust as needed)
   - **Alert thresholds**: 50%, 90%, 100%
   - **Email recipients**: Your email
6. Click **Finish**

**Recommended alert thresholds:**
- $5/day for development/testing
- $50/day for production launch
- Adjust based on traffic patterns

---

## Stripe Setup

### 5. Stripe Configuration

**Note:** Pricing is defined in code (`lib/types/index.ts`) using inline `price_data`. You do NOT need to create products/prices in Stripe dashboard.

#### For Testing (keep test keys until webhook is set up)
- [ ] Use test keys (`pk_test_...` and `sk_test_...`)
- [ ] Test card: `4242 4242 4242 4242` (any future date, any CVC)

#### Webhook Setup (do this AFTER deploying to Vercel)
1. [ ] Go to Stripe Dashboard > Developers > Webhooks
2. [ ] Click "Add endpoint"
3. [ ] Endpoint URL: `https://unboringsurveys.com/api/stripe/webhook`
4. [ ] Select events:
   - [ ] `checkout.session.completed`
   - [ ] `payment_intent.payment_failed`
5. [ ] Click "Add endpoint"
6. [ ] Copy the "Signing secret" (starts with `whsec_`)
7. [ ] Add `STRIPE_WEBHOOK_SECRET=whsec_...` to Vercel environment variables
8. [ ] Redeploy on Vercel to pick up the new env var

#### Go Live with Real Payments
- [ ] Switch to live keys in Vercel env vars:
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...`
  - `STRIPE_SECRET_KEY=sk_live_...`
- [ ] Create NEW webhook endpoint in Stripe (live mode has separate webhooks)
- [ ] Update `STRIPE_WEBHOOK_SECRET` with the live webhook secret
- [ ] Redeploy

---

## Vercel Deployment

### 6. Deploy to Vercel

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Deploy to production
vercel --prod
```

Or connect your GitHub repository for automatic deployments.

### 7. Post-Deployment Configuration

- [ ] Add custom domain in Vercel dashboard
- [ ] Configure SSL (automatic with Vercel)
- [ ] Update `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Update Firebase authorized domains with production URL
- [ ] Update Stripe webhook URL to production domain
- [ ] Test Stripe webhook with Stripe CLI:
  ```bash
  stripe listen --forward-to https://yourdomain.com/api/stripe/webhook
  ```

---

## Security Checklist

### 8. Security Verification

- [ ] Firestore rules deployed and tested
- [ ] No sensitive keys exposed in client-side code
- [ ] CORS configured properly
- [ ] Rate limiting enabled (client-side already implemented)
- [ ] Stripe webhook signature verification enabled
- [ ] Firebase App Check configured (optional but recommended)

---

## Testing Checklist

### 9. Pre-Launch Testing

- [ ] Create a test account
- [ ] Complete onboarding flow (username selection)
- [ ] Create a free survey
- [ ] Test survey response submission
- [ ] Verify response appears in dashboard
- [ ] Test CSV export (paid tier)
- [ ] Complete a Stripe checkout
- [ ] Verify payment updates survey status
- [ ] Test all adventure themes
- [ ] Test survey sharing links
- [ ] Verify rate limiting works
- [ ] Test on mobile devices

---

## Monitoring

### 10. Set Up Monitoring

- [ ] Enable Vercel Analytics (built-in)
- [ ] Set up Firebase Performance Monitoring
- [ ] Configure error tracking (Sentry recommended)
- [ ] Set up uptime monitoring (optional)
- [ ] Monitor Stripe dashboard for failed payments

---

## Go-Live Checklist

### 11. Final Steps

- [ ] Remove any test data from Firestore
- [ ] Verify all environment variables are set
- [ ] Test the production URL
- [ ] Verify Google Sign-in works on production domain
- [ ] Make first test payment with real card
- [ ] Announce launch!

---

## Post-Launch

### 12. Ongoing Maintenance

- [ ] Monitor Firebase usage daily for first week
- [ ] Review Stripe payments and webhooks
- [ ] Check error logs regularly
- [ ] Set up automated backups for Firestore (optional)
- [ ] Plan for scaling if traffic increases

---

## Quick Reference: Firebase Costs

Firestore pricing (pay-as-you-go):
- Document reads: $0.036 per 100,000
- Document writes: $0.108 per 100,000
- Document deletes: $0.012 per 100,000
- Storage: $0.108 per GB/month

**Estimated monthly costs at different scales:**
- 100 surveys, 1,000 responses: ~$1-2/month
- 1,000 surveys, 10,000 responses: ~$5-10/month
- 10,000 surveys, 100,000 responses: ~$30-50/month

Free tier includes:
- 50,000 reads/day
- 20,000 writes/day
- 1 GB storage

---

## Troubleshooting

### Common Issues

1. **"Firebase not initialized"**
   - Check all NEXT_PUBLIC_FIREBASE_* variables are set

2. **Stripe webhook fails**
   - Verify webhook secret matches
   - Check webhook URL is correct
   - Ensure events are selected in Stripe dashboard

3. **Google Sign-in fails**
   - Add domain to Firebase authorized domains
   - Check OAuth consent screen configuration

4. **Survey not loading**
   - Check Firestore indexes are created
   - Verify Firestore rules allow read access

---

Last updated: January 2026
