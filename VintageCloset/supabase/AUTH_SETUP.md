# Supabase Authentication Setup

This guide explains how to set up authentication for the Vintage Closet admin panel.

---

## 1. Enable Email Authentication

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Ensure **Email** provider is enabled (it should be by default)
4. Configure settings:
   - **Enable email confirmations**: Disable for admin (or enable if you want email verification)
   - **Secure email change**: Enable

---

## 2. Create Admin User

### Option A: Via Supabase Dashboard (Recommended)

1. Go to **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Enter:
   - **Email**: `admin@vintagecloset.at` (or your preferred email)
   - **Password**: A strong password (min 6 characters)
   - **Auto Confirm User**: ✅ Enable (so you can login immediately)
4. Click **Create user**

### Option B: Via SQL Editor

Run this in the Supabase SQL Editor:

```sql
-- Create admin user (replace email and password)
-- Note: This uses Supabase's auth.users table
-- Password will be hashed automatically

-- First, check if the user already exists
DO $$
DECLARE
  user_id UUID;
BEGIN
  -- Try to create the user via the auth API
  -- This is just for reference - use the Dashboard method above
  RAISE NOTICE 'Please create the user via Supabase Dashboard → Authentication → Users';
END $$;
```

**Important**: For security, always create users through the Supabase Dashboard rather than raw SQL.

---

## 3. Configure Email Templates (Optional)

If you want to customize password reset emails:

1. Go to **Authentication** → **Email Templates**
2. Customize the templates as needed

---

## 4. Test the Login

1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000/admin/login`
3. Enter your admin credentials
4. You should be redirected to the admin dashboard

---

## 5. Password Reset

If you forget your password:

### Via Dashboard
1. Go to **Authentication** → **Users**
2. Find your user
3. Click the three dots menu → **Send password recovery**

### Via App (Future Feature)
The login page can be extended to include a "Forgot Password" link that uses:

```typescript
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: 'https://your-domain.com/admin/reset-password',
});
```

---

## 6. Security Best Practices

### Row Level Security (RLS)
All tables already have RLS policies that check for authenticated users:
- `auth.role() = 'authenticated'` for admin operations
- Public read access for published content

### Session Management
- Sessions are automatically managed by Supabase
- Tokens refresh automatically
- Sign out clears the session

### Environment Variables
Make sure these are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 7. Multiple Admin Users (Optional)

To add more admin users:
1. Go to **Authentication** → **Users**
2. Click **Add user**
3. Create additional users as needed

All authenticated users have the same admin privileges. For role-based access control, you would need to:
1. Create a `profiles` or `admin_users` table
2. Add role checking in your RLS policies
3. Update the frontend to check roles

---

## Troubleshooting

### "Invalid login credentials"
- Check that the email and password are correct
- Ensure the user exists in Authentication → Users
- Check if the user is confirmed (Auto Confirm should be enabled)

### "Supabase not configured"
- Make sure `.env.local` has the correct Supabase URL and anon key
- Restart the development server after adding env variables

### Session not persisting
- Check browser cookies are enabled
- Clear browser storage and try again
- Check the browser console for errors

### RLS blocking operations
- Ensure you're logged in before performing admin operations
- Check that the RLS policies are correctly set up
- Verify the user's session is valid

---

## Quick Reference

| Action | Location |
|--------|----------|
| Create user | Dashboard → Authentication → Users |
| Reset password | Dashboard → Authentication → Users → [user] → Send recovery |
| View sessions | Dashboard → Authentication → Users → [user] |
| Configure providers | Dashboard → Authentication → Providers |
| Email templates | Dashboard → Authentication → Email Templates |

