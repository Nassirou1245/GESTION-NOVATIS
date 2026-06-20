# NPMS Enterprise PWA

NOVATIS Property Management System - Enterprise Edition.

This is the production Supabase-backed PWA for Centre Commercial Madina. The app is English-first, includes French support, and keeps JSON import/export plus PostgreSQL persistence.

## Production setup

1. Create or open the Supabase project.
2. Open SQL Editor.
3. Run `sql/schema.sql`.
4. In Supabase Authentication, create the admin user.
5. Optional: insert an admin row in `profiles` with role `Super Admin`.
6. In Project Settings > API, copy:
   - Project URL
   - anon public key
7. Open `index.html`.
8. Paste URL + anon key.
9. Sign in and click Test.

## Build check

Run:

```bash
npm run build
```

On Windows PowerShell, use `npm.cmd run build` if scripts are blocked.

## Data policy

Production data lives in Supabase/PostgreSQL. Demo mode is clearly separated in the browser and does not overwrite Supabase.
