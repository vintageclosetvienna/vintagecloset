# Vintage Closet: how to change settings

Short how-tos for everything added since October 2026. Code changes are one line each; after any code change, push to `master` and Vercel publishes in about 2 minutes.

## Newsletter and 20% welcome code

**Turn it on (one time)**
1. Create a free account at resend.com (free: 3,000 emails per month, 100 per day).
2. Resend → **Domains → Add domain** → `vintagecloset.app`, region **EU (Ireland)**.
3. Add the DNS records Resend shows in Vercel → **Domains → vintagecloset.app → DNS Records** (Vercel hosts the DNS). Wait until Resend says **Verified**.
4. Resend → **API Keys → Create** (permission: *Sending access*, domain: vintagecloset.app). Copy the key.
5. Vercel → project **vintagecloset → Settings → Environment Variables** → add `RESEND_API_KEY` = the key (Production + Preview, mark *Sensitive*). Never paste the key into chats or files.
6. Vercel → **Deployments → … → Redeploy**. The pop-up appears by itself once the key is set.

| What | Where to change it |
|---|---|
| Discount % (20) | `src/lib/newsletter.ts` → `WELCOME_DISCOUNT_PERCENT` |
| Code valid for (90 days = 3 months) | `src/lib/newsletter.ts` → `WELCOME_CODE_VALID_DAYS` |
| Confirmation link lifetime (48 h) | `src/lib/newsletter.ts` → `CONFIRM_LINK_VALID_HOURS` |
| Spam limits | `src/lib/newsletter.ts` → `MAX_SIGNUPS_PER_IP_PER_HOUR`, `MAX_EMAILS_PER_ADDRESS_PER_DAY` |
| Consent wording | `src/lib/newsletter.ts` → `CONSENT_TEXT` **and** `src/components/layout/NewsletterPopup.tsx` → `CONSENT_LABEL` (keep both identical) |
| Pop-up delay (8 s) / hidden for 30 days after closing | `NewsletterPopup.tsx` → `SHOW_AFTER_MS`, `HIDE_DAYS_AFTER_CLOSE` |
| Pages without pop-up | `NewsletterPopup.tsx` → `HIDDEN_ON` |
| Pop-up photo | Admin → **Site Images** → first *Media Carousel* image |
| Sender name/address | Vercel env `EMAIL_FROM`, e.g. `Vintage Closet <hello@vintagecloset.app>` |
| Email texts | `src/app/api/newsletter/subscribe/route.ts` (confirm email), `confirm/route.ts` (welcome email) |
| Turn the pop-up off | Remove `RESEND_API_KEY` in Vercel and redeploy |

**Daily use:** Admin → **Newsletter** shows sign-ups (confirmed / waiting / unsubscribed), the chosen collection and whether the code was used. **Export confirmed (CSV)** gives the list for sending newsletters (only confirmed emails may get newsletters). Single codes can be switched off in Admin → **Gutscheine**.

**Security built in:** confirmation by email (double opt-in) before any code; codes are single-use, 3 months, and only work with the email they were sent to; links are random tokens stored only as hashes; confirm/unsubscribe need a click (email scanners can't trigger them); rate limits and a bot trap; the subscriber list is not readable from the public website.

## Domain
- Main address: `https://www.vintagecloset.app`. Change it in `src/lib/site.ts` (`SITE_URL`) and `next.config.ts`.
- `vintagecloset.app` → www and `vintagecloset.vercel.app` → www are automatic. Domains: Vercel → **Settings → Domains**.

## Brand, logo, colours
- See `BRAND.md`. Logo file `public/brand/vintage-closet-logo.png`; colours in `src/styles/tokens.css`.

## Homepage
- Hero photos: Admin → **Site Images** → hero left/center/right. Autoplay speed: `src/components/landing/Hero.tsx` → `AUTOPLAY_MS`.
- New Arrivals count on the homepage: `src/app/page.tsx` → `<NewArrivals limit={7} />`.
- Men/Women buttons: `Hero.tsx` → `SIDE_BUTTON_CLASS`.

## Menu
- Tabs, groups and icons: `src/components/layout/MenuDrawer.tsx` → `MENU_TABS`, `GROUPS`.
- Social links (footer, menu, Google): `src/lib/site.ts` → `SOCIAL_LINKS`.

## AI product autofill
- Model: Vercel env `OPENAI_MODEL` (default `gpt-5.6-sol`). Texts and rules: `src/app/api/generate-description/route.ts` → `SYSTEM_PROMPT`.

## Vercel Pro
- Analytics and Speed Insights: Vercel → project → **Analytics** / **Speed Insights**.
- Server region (Dublin, next to the database): `vercel.json` → `regions`.

## Database security (Supabase)
- Private tables (orders, pickup codes, newsletter) can't be read with the public website key; only logged-in admins and the server can. Rules live in `supabase/*.sql`.
- Check anytime: Supabase → project **vintageclosetvienna → Advisors → Security Advisor**. Anything marked *Error* needs fixing; ask Claude with the screenshot.
- Recommended one-click setting: Supabase → **Authentication → Sign In / Providers → Email → Leaked password protection** → on (blocks admin passwords known from data leaks).
