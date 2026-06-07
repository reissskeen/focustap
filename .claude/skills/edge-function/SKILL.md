---
name: edge-function
description: Use when creating or editing any file under supabase/functions/<name>/. Loads for new edge functions, edits to existing ones, and CORS or auth changes inside them. Covers the required CORS allowlist, the auth.getUser() pattern (not getSession), why the service role key must never reach the client, and the standard response shape. Does not load for client-side code that calls an edge function — that goes through supabase-hook.
---

# Supabase Edge Functions (Deno)

## Layout

```
supabase/functions/
└── <function-name>/
    └── index.ts
```

Function name is the URL path: `/functions/v1/<function-name>`.

## CORS — required on every function

```ts
const ALLOWED_ORIGINS = [
  "https://focustap.org",
  "https://www.focustap.org",
  "http://localhost:8080",
];

function corsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}
```

Handle the `OPTIONS` preflight before any other logic — return `204` with the CORS headers.

## Auth — getUser, not getSession

```ts
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ANON_KEY")!,
  { global: { headers: { Authorization: req.headers.get("Authorization")! } } },
);

const { data: { user } } = await supabase.auth.getUser();
if (!user) return new Response("Unauthorized", { status: 401, headers: corsHeaders(...) });
```

`getSession()` reads from cookies which don't exist server-side. Always `getUser()` with the bearer token.

## Service role usage

Service role is **only** for operations the user shouldn't be able to do themselves (e.g. assigning a role after validating a teacher code). Service role client:

```ts
const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);
```

The service role key **must never** be returned, logged in client-visible output, or used in the user-context client.

## Reference

Copy the pattern from `supabase/functions/assign-teacher-role/index.ts`. It has the correct CORS, auth check, error shape, and service-role split.

## Don't

- Don't skip the OPTIONS handler — browsers will block the real request
- Don't use `*` for `Access-Control-Allow-Origin` — keep the allowlist
- Don't return raw error objects to the client — they may leak internals
