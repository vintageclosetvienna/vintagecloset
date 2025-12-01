# Environment Variables Setup

Create a `.env.local` file in the project root with the following variables:

```env
# ============================================
# SUPABASE
# ============================================
# Get these from: Supabase Dashboard → Settings → API

NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# ============================================
# STRIPE
# ============================================
# Get these from: https://dashboard.stripe.com/apikeys

STRIPE_SECRET_KEY=sk_test_your-secret-key-here
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret-here

# ============================================
# OPENAI (for AI description generation)
# ============================================
# Get from: https://platform.openai.com/api-keys

OPENAI_API_KEY=sk-your-openai-api-key-here
```

## Where to Find Each Key

### Supabase
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### Stripe
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy your **Secret key** → `STRIPE_SECRET_KEY`
3. For webhooks:
   - Go to **Developers** → **Webhooks**
   - Add endpoint: `https://your-domain.com/api/webhooks/stripe`
   - Select events: `checkout.session.completed`, `checkout.session.expired`
   - Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### OpenAI
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy it → `OPENAI_API_KEY`

## Local Development with Stripe Webhooks

For local testing of Stripe webhooks, use the Stripe CLI:

```bash
# Install Stripe CLI
# macOS: brew install stripe/stripe-cli/stripe
# Windows: scoop install stripe

# Login to Stripe
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copy the webhook signing secret it outputs to your .env.local
```

