# PlayThis - Future Features & Ideas

## 🚨 PRE-LAUNCH CHECKLIST

### Stripe Webhooks Setup (Required Before Going Live)
**Current Status:** Payment verification works via redirect, but webhooks are more reliable for production.

**Steps to complete:**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://YOUR-DOMAIN.com/api/stripe/webhook`
3. Select event: `checkout.session.completed`
4. Copy the webhook signing secret
5. Add to `.env.local`: `STRIPE_WEBHOOK_SECRET=whsec_...`
6. Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

**Why it matters:** Webhooks ensure payment is recorded even if user closes browser before redirect completes.

---

## 🎯 High Priority (Build After V1)

### Gift Card Incentives
**Description:** Allow survey creators to offer automated gift card rewards (Amazon, Starbucks, etc.) to random respondents.

**User Story:** "As a survey creator, I want to offer a $25 Amazon gift card to increase responses, and have the system automatically select and notify the winner."

**Technical Requirements:**
- Stripe Checkout integration for creator payment
- Tremendous API integration for gift card fulfillment
- Random winner selection algorithm
- Email notification system (SendGrid/Resend)
- Creator dashboard: set incentive, view drawing status

**Estimated Build Time:** 1-2 weeks
**Business Impact:** Could increase completion rates by 40%+, premium feature for pricing tier
**Status:** Mockup ready for pitch, build post-launch

---

## 🔮 Medium Priority (V2-V3)

### [Leave blank for now - we'll add ideas as they come up]

---

## 💡 Backlog (Ideas to Explore)

### [Leave blank for now - we'll add ideas as they come up]

---

## 📝 Notes

- Prioritize features that increase completion rates or reduce creator friction
- Validate with real users before building complex integrations
- Consider pricing tier implications for each feature

### Additional Challenge Themes
**Description:** Expand beyond Ice Cream to offer 4 more interactive themes: Pizza Builder, Garden Grower, Dream Home, Coffee Brewer

**User Story:** "As a survey creator, I want to choose from multiple themes so respondents can pick the experience that resonates with them."

**Technical Requirements:**
- Build 4 new adventure components (same structure as IceCreamSundae)
- Add theme selector to survey creation flow
- Allow creators to lock to one theme OR let respondents choose
- Update database schema to support theme selection

**Themes to Build:**
1. **Pizza Builder:** Crust → Sauce → Cheese → Toppings → Bake
2. **Garden Grower:** Soil → Seed → Water → Sprout → Bloom
3. **Dream Home:** Foundation → Walls → Roof → Windows → Landscape
4. **Coffee Brewer:** Beans → Grind → Brew → Pour → Finishing touches

**Estimated Build Time:** 2-3 days per theme (8-12 days total)
**Business Impact:** More themes = broader appeal, higher engagement
**Status:** Detailed specs ready, build after V1 validates core concept
