# Security Checklist for Production Deployment

## ✅ Pre-Deployment Security Review

### Code Security

- [x] Removed `console.log` statements from production code
- [x] All secrets use environment variables (no hardcoded keys)
- [x] `.env` file is in `.gitignore`
- [x] Price IDs are validated against allowlist (prevents arbitrary price injection)
- [x] Server-side validation for all checkout inputs
- [x] Error messages don't leak sensitive information
- [x] API routes marked as `prerender = false` (server-rendered)

### Environment Variables Setup

#### Local Development (.env)

- [ ] `STRIPE_SECRET_KEY` = `sk_test_...` (test key)
- [ ] `STRIPE_ALLOWED_PRICE_IDS` = Comma-separated test price IDs (**required**)
  - Format: `price_1ABC...,price_1XYZ...,price_1DEF...` (order doesn't matter)
  - Example: `price_1SkvhUQUcTF9g5AtwjzUCTlS,price_1SkvhjQUcTF9g5AtlAq8cnXX,price_1SkvhvQUcTF9g5AtM423MFy3`
- [ ] `SITE_URL` = `http://localhost:4321` (or your local dev URL)
- [ ] `STRIPE_ALLOWED_COUNTRIES` = `US` (or comma-separated list)
- [ ] `STRIPE_SHIPPING_RATE_ID` = Your test shipping rate ID (optional)

#### Vercel Production Environment Variables

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these for **Production** environment:

- [ ] `STRIPE_SECRET_KEY` = `sk_live_...` (**LIVE key, not test!**)
- [ ] `STRIPE_ALLOWED_PRICE_IDS` = Comma-separated **LIVE** price IDs (**required**)
  - Format: `price_1ABC...,price_1XYZ...,price_1DEF...` (order doesn't matter)
  - Use the same env var name as dev, just with LIVE price IDs
- [ ] `SITE_URL` = Your production domain (e.g., `https://yourdomain.com`)
- [ ] `STRIPE_ALLOWED_COUNTRIES` = `US` (or comma-separated list)
- [ ] `STRIPE_SHIPPING_RATE_ID` = Your **LIVE** shipping rate ID (optional)

### Stripe Dashboard Configuration

#### Test Mode (for local testing)

- [ ] Origin address set in Test mode Tax Settings
- [ ] Tax registrations added in Test mode (e.g., California)
- [ ] Product tax codes set in Test mode
- [ ] Test products/prices configured

#### Live Mode (for production)

- [ ] **Switch to Live mode** in Stripe Dashboard
- [ ] Origin address set in **Live mode** Tax Settings
- [ ] Tax registrations added in **Live mode** (e.g., California)
- [ ] Product tax codes set in **Live mode**
- [ ] **LIVE** products/prices created and configured
- [ ] Email receipts enabled (if desired)
- [ ] Shipping address collection enabled

### Security Best Practices

- [x] No secrets committed to git
- [x] Price ID allowlist prevents arbitrary price injection
- [x] Server-side validation for all user inputs
- [x] Proper error handling (no stack traces exposed)
- [ ] Consider adding rate limiting (Vercel Pro or middleware)
- [ ] Monitor Stripe Dashboard for suspicious activity
- [ ] Set up Stripe webhook signature verification (if using webhooks later)

### Testing Before Going Live

- [ ] Test checkout flow in **Test mode** locally
- [ ] Test with a small transaction in **Live mode** (use test card: `4242 4242 4242 4242`)
- [ ] Verify tax calculation works correctly
- [ ] Verify shipping address collection works
- [ ] Verify cart clears after successful payment
- [ ] Verify success/cancel URLs redirect correctly
- [ ] Test with different shipping addresses (registered vs non-registered states)

### Post-Deployment Monitoring

- [ ] Monitor Vercel logs for errors
- [ ] Monitor Stripe Dashboard for successful payments
- [ ] Check that tax is calculating correctly in production
- [ ] Verify environment variables are loaded correctly (check Vercel logs)
- [ ] Set up Stripe webhook endpoint (if needed for order fulfillment)

## 🚨 Critical: Test vs Live Keys

**NEVER mix test and live keys:**

- Local `.env` → Use `sk_test_...`
- Vercel Production → Use `sk_live_...`
- Stripe Dashboard → Switch between Test/Live modes accordingly

## 📝 Notes

- The hardcoded price IDs in `create-checkout-session.js` are fallbacks. Prefer using `STRIPE_ALLOWED_PRICE_IDS` env var in production.
- Webhook endpoint (`stripe-webhook.js`) is currently empty. Implement signature verification if you plan to use webhooks.
- Consider adding rate limiting for production traffic (Vercel Pro plan or custom middleware).

## 🔗 Useful Links

- [Stripe Tax Setup](https://dashboard.stripe.com/settings/tax)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Stripe Security Best Practices](https://stripe.com/docs/security/guide)
