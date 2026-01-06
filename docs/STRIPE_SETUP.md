# Stripe Integration Setup Guide

This guide walks you through setting up Stripe payment integration for FlexiWell CRM.

## Prerequisites

- A Stripe account (create one at [stripe.com](https://stripe.com))
- Access to your Stripe Dashboard
- Your FlexiWell CRM environment variables file

## Step 1: Get Your API Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to **Developers** → **API keys**
3. Copy your keys:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

Add these to your `.env` file:

```env
STRIPE_SECRET_KEY=sk_test_your_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
```

## Step 2: Create Products and Prices

In your Stripe Dashboard, create products for each plan tier:

### Plans to Create

| Plan | Monthly Price | Annual Price |
|------|---------------|--------------|
| Starter | $49/month | $468/year ($39/mo) |
| Growth | $99/month | $948/year ($79/mo) |
| Business | $179/month | $1,788/year ($149/mo) |
| Professional | $199/month | $1,908/year ($159/mo) |
| Enterprise | $399/month | $3,828/year ($319/mo) |

### Creating Products in Stripe

1. Go to **Products** → **Add product**
2. For each plan:
   - **Name**: e.g., "FlexiWell Starter"
   - **Description**: Plan description
   - Click **Add product**
3. Add pricing for each product:
   - Click **Add another price**
   - Select **Recurring**
   - Set **Monthly** price
   - Add another price for **Yearly** (set as yearly billing)

### Getting Price IDs

After creating prices, copy each Price ID (starts with `price_`) and add to your `.env`:

```env
# Starter Plan
STRIPE_PRICE_STARTER_MONTHLY=price_xxxxxxxxxxxxxx
STRIPE_PRICE_STARTER_ANNUAL=price_xxxxxxxxxxxxxx

# Growth Plan
STRIPE_PRICE_GROWTH_MONTHLY=price_xxxxxxxxxxxxxx
STRIPE_PRICE_GROWTH_ANNUAL=price_xxxxxxxxxxxxxx

# Business Plan
STRIPE_PRICE_BUSINESS_MONTHLY=price_xxxxxxxxxxxxxx
STRIPE_PRICE_BUSINESS_ANNUAL=price_xxxxxxxxxxxxxx

# Professional Plan
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_xxxxxxxxxxxxxx
STRIPE_PRICE_PROFESSIONAL_ANNUAL=price_xxxxxxxxxxxxxx

# Enterprise Plan
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_xxxxxxxxxxxxxx
STRIPE_PRICE_ENTERPRISE_ANNUAL=price_xxxxxxxxxxxxxx
```

## Step 3: Create Add-on Products

Create products for add-ons:

| Add-on | Price | Billing |
|--------|-------|---------|
| Extra WhatsApp Messages | $19/month | Recurring |
| Extra AI Chats | $29/month | Recurring |
| SMS Bundle (1000) | $25/month | Recurring |
| Additional Location | $49/month | Recurring |
| Additional Storage (50GB) | $15/month | Recurring |
| White Glove Migration | $299 | One-time |

Add the Price IDs to your `.env`:

```env
# Add-ons
STRIPE_PRICE_ADDON_WHATSAPP=price_xxxxxxxxxxxxxx
STRIPE_PRICE_ADDON_AI=price_xxxxxxxxxxxxxx
STRIPE_PRICE_ADDON_SMS=price_xxxxxxxxxxxxxx
STRIPE_PRICE_ADDON_LOCATION=price_xxxxxxxxxxxxxx
STRIPE_PRICE_ADDON_STORAGE=price_xxxxxxxxxxxxxx
STRIPE_PRICE_ADDON_MIGRATION=price_xxxxxxxxxxxxxx
```

## Step 4: Set Up Webhooks

Webhooks allow Stripe to notify your app about payment events.

### For Local Development

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. Copy the webhook signing secret (starts with `whsec_`)
5. Add to your `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxx
   ```

### For Production

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your endpoint URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `invoice.upcoming`
5. Click **Add endpoint**
6. Copy the **Signing secret** and add to your production environment

## Step 5: Configure Customer Portal

1. Go to **Settings** → **Billing** → **Customer portal**
2. Configure allowed actions:
   - ✅ Update subscriptions
   - ✅ Cancel subscriptions
   - ✅ Update payment methods
   - ✅ View invoice history
3. Customize branding (optional)
4. Save changes

## Step 6: Test the Integration

### Test Mode

Always use test mode (`pk_test_` and `sk_test_` keys) during development.

### Test Cards

Use these test card numbers:
- **Success**: `4242 4242 4242 4242`
- **Requires authentication**: `4000 0025 0000 3155`
- **Declined**: `4000 0000 0000 9995`

Use any future expiry date and any 3-digit CVC.

### Testing Webhooks

Use Stripe CLI to trigger test events:
```bash
stripe trigger checkout.session.completed
stripe trigger invoice.paid
stripe trigger customer.subscription.updated
```

## API Routes Reference

### Checkout

- `POST /api/stripe/checkout` - Create checkout session for a plan
- `POST /api/stripe/checkout/addon` - Create checkout session for an add-on

### Portal

- `POST /api/stripe/portal` - Create customer portal session

### Subscription

- `GET /api/stripe/subscription` - Get current subscription details
- `POST /api/stripe/subscription/change` - Upgrade/downgrade plan
- `POST /api/stripe/subscription/preview` - Preview plan change proration
- `POST /api/stripe/subscription/cancel` - Cancel subscription
- `POST /api/stripe/subscription/reactivate` - Reactivate canceled subscription
- `POST /api/stripe/subscription/addons` - Add add-on to subscription
- `DELETE /api/stripe/subscription/addons` - Remove add-on from subscription

### Invoices

- `GET /api/stripe/invoices` - Get invoice history

### Webhooks

- `POST /api/stripe/webhook` - Handle Stripe webhook events

## Subscription Flow

### New Customer
1. Customer visits `/pricing`
2. Selects plan and billing period
3. Redirected to Stripe Checkout
4. After payment, webhook updates user record
5. Customer redirected to `/admin/billing?success=true`

### Upgrade/Downgrade
1. Customer visits `/admin/billing`
2. Clicks "Change Plan"
3. Previews proration
4. Confirms change
5. Upgrade: charged immediately with proration
6. Downgrade: takes effect at end of billing period

### Cancellation
1. Customer visits `/admin/billing`
2. Clicks "Cancel"
3. Chooses cancel at period end or immediately
4. Webhook updates user record

## Troubleshooting

### Webhook Signature Verification Failed
- Ensure `STRIPE_WEBHOOK_SECRET` is correct
- For local dev, make sure Stripe CLI is running
- Check that webhook endpoint URL is correct

### Checkout Session Not Created
- Verify API keys are correct
- Check Price IDs exist in Stripe
- Ensure user is authenticated (for logged-in checkout)

### Subscription Not Updating
- Check webhook is receiving events
- Verify webhook secret is correct
- Check MongoDB connection

## Going Live

When ready for production:

1. Switch to live API keys (`pk_live_`, `sk_live_`)
2. Create products/prices in live mode (or copy from test mode)
3. Update webhook endpoint to production URL
4. Update webhook secret to production secret
5. Test with real cards (small amounts)

## Security Best Practices

- Never expose `STRIPE_SECRET_KEY` on the client side
- Always verify webhook signatures
- Use HTTPS in production
- Store `stripeCustomerId` in your database
- Log all subscription events for auditing
