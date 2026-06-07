---
name: rls-migration
description: Use when creating or editing SQL files under supabase/migrations/, or when adding/modifying Row Level Security policies. Loads for any schema change, new table, new column, new policy, or grant. Covers the timestamp filename format, the RLS-enabled-on-every-table rule, the role-check pattern via user_roles, and how to write policies that match how the client queries data (auth.uid() + role join). Does not load for read-only SQL or one-off queries in the dashboard.
---

# Supabase Migrations & RLS

## Filename format

```
supabase/migrations/YYYYMMDDHHMMSS_short_description.sql
```

Use the current UTC timestamp. Filenames must be **unique and monotonically increasing** — Supabase applies in lexical order.

```bash
date -u +%Y%m%d%H%M%S
```

## Every new table needs all four

1. `CREATE TABLE`
2. `ALTER TABLE <name> ENABLE ROW LEVEL SECURITY;`
3. At minimum a `SELECT` policy — explicit, not relying on defaults
4. Policies for any other operation the client performs (`INSERT`, `UPDATE`, `DELETE`)

A table with RLS enabled and zero policies returns zero rows. That is the most common bug here.

## Role check pattern

Roles live in `user_roles (user_id, role)` where role is `'student' | 'teacher' | 'admin'`. To gate on role inside a policy:

```sql
CREATE POLICY "teachers can read sessions they own"
  ON sessions
  FOR SELECT
  USING (
    teacher_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'teacher'
    )
  );
```

Do not put role strings in JWT claims — they live in `user_roles` and that's the source of truth.

## Cascade behavior

Foreign keys that reference a parent the user can delete must use `ON DELETE CASCADE` (or `SET NULL` if the child should survive). Past bug: deleting a course failed because `sessions.course_id` had no cascade.

## After writing the migration

- Read it back end-to-end before pushing
- Push with `npx supabase db push` (only when the user asks — never auto-push)
- If the migration adds a policy, mentally run a query as student/teacher/anon and confirm the policy is satisfied

## Don't

- Don't disable RLS to "test" — write the policy correctly the first time
- Don't expose service-role-only data via a permissive policy
- Don't reference `auth.jwt()` claims for role — use `user_roles`
