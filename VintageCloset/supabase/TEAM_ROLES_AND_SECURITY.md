# Team roles and security (applied 2026-10-26)

These changes were applied directly to the live Supabase project `vintageclosetvienna`
as migrations (Supabase → Database → Migrations):

| Migration | What it does |
|---|---|
| `restrict_admin_to_allowlist` | Table `public.admin_users` (team list) and `is_admin()`. Every policy that used `auth.role() = 'authenticated'` now uses `is_admin()`, so a signed-in account that is not on the list can do nothing. |
| `restrict_storage_writes_to_admins` | Same rule for uploads and deletes in the image buckets. |
| `staff_roles_and_permissions` | Roles `owner`, `manager`, `staff`, `studio` in `admin_users.role`; helpers `current_staff_role()`, `is_staff()`, `is_studio()`, `my_staff_profile()`. `products.is_draft` (drafts are hidden from the shop). Staff may add/edit products, work orders and pickup codes, prepare events and journal posts, upload product images. Only owner/manager may delete anything, edit discount codes, site images, archive stories or read newsletter data. |
| `staff_workspace_tables` | Bucket `studio` and tables `studio_photos`, `staff_shifts`, `staff_notes`, `staff_tasks`, `daily_checks` for the team app at `/staff`. |
| `activity_log` | `public.activity_log` plus trigger `log_changes` on products, orders, pickup codes, discount codes, events, journal, site images, archive stories, studio photos and the team list. Records who changed what. Managers read everything, staff read their own entries. |
| `close_public_signups` | Trigger on `auth.users`: a login can only be created (or an email changed) for an address that is already in `admin_users`. Public sign-up is closed. |

## Adding a team member
1. `insert into public.admin_users(email, role, display_name) values ('name@example.com', 'staff', 'Name');`
2. Supabase → Authentication → Users → Add user (same email, auto-confirm). Without step 1 the account is refused.

## Accounts
- `vintageclosetvienna@gmail.com`: owner (full admin)
- `sobhi.aksh@gmail.com`: owner (developer)
- `staff@vintagecloset.app`: staff (shop account for the team app)

Passwords are never stored in this repo.
