# Stripe Setup Guide for MealPrep360 Subscription System

This guide will help you set up Stripe for the MealPrep360 subscription system with multiple tiers, annual billing, and retention features.

## 1. Stripe Dashboard Setup

### Create Products and Prices

1. **Log into your Stripe Dashboard**
2. **Navigate to Products** (Products → Products)
3. **Create the following products:**

#### Starter Plan

- **Product Name:** MealPrep360 Starter
- **Description:** Perfect for individuals starting their meal planning journey
- **Create Prices:**
  - Monthly: $9.99/month (recurring)
  - Yearly: $99.90/year (recurring)

#### Plus Plan

- **Product Name:** MealPrep360 Plus
- **Description:** Advanced features for active meal planners
- **Create Prices:**
  - Monthly: $14.99/month (recurring)
  - Yearly: $149.90/year (recurring)

#### Family Plan

- **Product Name:** MealPrep360 Family
- **Description:** Perfect for families with unlimited features
- **Create Prices:**
  - Monthly: $24.99/month (recurring)
  - Yearly: $249.90/year (recurring)

#### Professional Plan

- **Product Name:** MealPrep360 Professional
- **Description:** For food professionals and businesses
- **Create Prices:**
  - Monthly: $49.99/month (recurring)
  - Yearly: $499.90/year (recurring)

## 2. Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # Your Stripe publishable key
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook endpoint secret

# Monthly Price IDs
NEXT_PUBLIC_STRIPE_STARTER_MONTHLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PLUS_MONTHLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_FAMILY_MONTHLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID=price_...

# Yearly Price IDs
NEXT_PUBLIC_STRIPE_STARTER_YEARLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PLUS_YEARLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_FAMILY_YEARLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PROFESSIONAL_YEARLY_PRICE_ID=price_...

# Retention Coupons (Optional)
STRIPE_RETENTION_DISCOUNT_COUPON_ID=... # 25% off for 3 months
STRIPE_ANNUAL_DISCOUNT_COUPON_ID=... # Annual billing discount
```

## 3. Create Coupons for Retention

### Retention Discount Coupon

1. **Navigate to Coupons** (Products → Coupons)
2. **Create New Coupon:**
   - **ID:** `retention-25-off-3months`
   - **Type:** Percentage
   - **Amount:** 25%
   - **Duration:** Repeating
   - **Duration in months:** 3
   - **Description:** Retention offer - 25% off for 3 months

### Annual Billing Discount (Optional)

1. **Create New Coupon:**
   - **ID:** `annual-billing-discount`
   - **Type:** Percentage
   - **Amount:** 17%
   - **Duration:** Once
   - **Description:** Annual billing discount

## 4. Webhook Configuration

### Create Webhook Endpoint

1. **Navigate to Webhooks** (Developers → Webhooks)
2. **Add Endpoint:**

   - **URL:** `https://yourdomain.com/api/webhooks/stripe`
   - **Events to send:**
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `customer.created`
     - `customer.updated`

3. **Copy the webhook secret** and add it to your environment variables

## 5. Test the Integration

### Test Cards

Use these test card numbers in development:

- **Successful payment:** `4242424242424242`
- **Declined payment:** `4000000000000002`
- **Requires authentication:** `4000002500003155`

### Test Scenarios

1. **Subscription Creation:**

   - Sign up for each plan (monthly/yearly)
   - Verify webhook events are received
   - Check user data is updated in MongoDB

2. **Subscription Updates:**

   - Upgrade from Starter to Plus
   - Downgrade from Family to Plus
   - Switch from monthly to yearly billing

3. **Cancellation Flow:**
   - Test retention offers
   - Test immediate cancellation
   - Test cancellation at period end

## 6. Production Checklist

### Before Going Live:

- [ ] Replace test keys with live keys
- [ ] Update webhook endpoint to production URL
- [ ] Test all subscription flows with real payment methods
- [ ] Set up proper error monitoring
- [ ] Configure Stripe tax settings if needed
- [ ] Set up proper customer communication emails in Stripe

### Security Considerations:

- [ ] Verify webhook signatures
- [ ] Use HTTPS for all endpoints
- [ ] Implement proper error handling
- [ ] Log important events for debugging
- [ ] Set up monitoring for failed payments

## 7. Usage Monitoring

The system automatically tracks:

- AI recipe generations per month
- Recipe image generations per month
- Blog post generations per month

Usage resets monthly and is enforced before API calls.

## 8. Retention Features

The cancellation flow includes:

- **Discount offers:** 25% off for 3 months
- **Pause subscription:** 30-day pause
- **Downgrade options:** Switch to lower tier
- **Feedback collection:** Understand cancellation reasons

## 9. Common Issues and Solutions

### Issue: Webhook not receiving events

- **Solution:** Check webhook URL is publicly accessible
- **Solution:** Verify webhook secret matches environment variable
- **Solution:** Check Stripe logs for delivery attempts

### Issue: Price ID not found

- **Solution:** Ensure all price IDs are correctly copied from Stripe dashboard
- **Solution:** Verify environment variables are loaded correctly

### Issue: Subscription update fails

- **Solution:** Check user has valid Stripe customer ID
- **Solution:** Verify subscription is in active state
- **Solution:** Check Stripe logs for detailed error messages

## 10. Next Steps

After setup:

1. **Monitor subscription metrics** in Stripe dashboard
2. **Set up email notifications** for important events
3. **Implement analytics** to track conversion rates
4. **A/B test** pricing and retention strategies
5. **Add more retention offers** based on user feedback

## Support

For Stripe-specific issues:

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com/)

For implementation questions:

- Check the API routes in `/src/app/api/subscription/`
- Review the subscription types in `/src/types/subscription.ts`
- Test with the usage tracker in `/src/lib/usage-tracker.ts`
