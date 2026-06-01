# Secure Workspace ERP

Mini ERP assignment for managing workspace resource inventory and employee requests.

## Features

- Next.js App Router, TypeScript, Tailwind CSS
- Supabase Auth with automatic `profiles` creation
- Employee, manager, and admin roles
- Inventory browsing and staff inventory creation
- Receipt-backed resource request workflow
- Private Supabase Storage bucket at `receipts/<user-id>/*`
- Strict Row Level Security policies for profiles, inventory, requests, and receipt objects
- Transaction-safe Postgres function `process_item_request`
- Supabase Edge Function `generate-monthly-report`

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

3. Apply the database migration in Supabase SQL editor:

```sql
-- supabase/migrations/001_secure_workspace_erp.sql
```

4. Optionally run `supabase/seed.sql` after creating the schema.

5. Run the app:

```bash
npm.cmd run dev
```

On this Windows setup, use `npm.cmd` instead of `npm` if PowerShell says scripts are disabled. The project scripts also set the Next.js WASM SWC fallback automatically, so you should not need to manually set `NEXT_TEST_WASM_DIR`.

## Supabase Deployment Notes

- Promote a user by updating `public.profiles.role` to `manager` or `admin` from the Supabase dashboard.
- Deploy the report function:

```bash
supabase functions deploy generate-monthly-report
```

- The Edge Function validates the caller JWT, then checks `profiles.role` before returning the last 30 days of request data.
- The approval flow calls `process_item_request`, which locks the request row and inventory row with `for update`, validates stock, updates inventory, and rolls back automatically if any error is raised.

## Main Paths

- `/login` - sign in and employee sign up
- `/` - dashboard
- `/request` - submit resource request with receipt upload
- `/requests` - employee request history
- `/admin/requests` - manager/admin approvals
- `/admin/inventory` - manager/admin inventory creation
- `/admin/report` - Edge Function report viewer
