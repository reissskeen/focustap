# FocusTap — Security Overview

_Maintained by FocusTap LLC. Last updated 2026-06-15._

This document describes FocusTap's architecture, data flow, subprocessors, and
security controls. It supports our EDUCAUSE **HECVAT 4.1.5** responses (see the
admin-only assessment at `/hecvat`). For vulnerability reports, email
**reiss@focustap.org**.

## What FocusTap is

A browser-based classroom engagement and attendance platform. Students check in
via an NFC tag/QR/session link; instructors see real-time focus tracking,
engagement scores (FEI), and post-session reports. There is **no screen
monitoring, no app blocking, and no software installed** on student devices.

## Architecture & data flow

```
Student / Teacher / Admin browser (React SPA, served by Vercel CDN)
        │  HTTPS (TLS 1.2+)                         │ HTTPS
        ▼                                           ▼
Supabase Auth (JWT)                         Supabase Edge Functions (Deno)
        │                                           │ service-role (server-side only)
        ▼                                           ▼
Supabase Postgres  ──  Row Level Security (RLS) on every table, role-checked via user_roles
        │
        ├─ Resend  → transactional email (focustap.org)
        └─ Sentry  → error tracking (sendDefaultPii = false)
```

- **Frontend:** React 18 + TypeScript + Vite SPA, hosted on Vercel (HTTPS-only, global CDN).
- **Backend:** Supabase — managed Postgres, Auth, and Edge Functions, running on AWS.
- **Tenancy:** Multi-tenant with **logical isolation** enforced by Postgres Row Level
  Security and `institution_id` scoping (53 policies across all tables).
- **Email:** Resend (verified domain focustap.org).
- **Error tracking:** Sentry, configured with `sendDefaultPii: false`.

## Subprocessors

| Subprocessor | Purpose | Data | Attestation |
|---|---|---|---|
| Supabase (on AWS) | Database, auth, edge functions, hosting | All application data | SOC 2 (Supabase + AWS) |
| Vercel | Frontend hosting / CDN | Static assets, request metadata | SOC 2 |
| Resend | Transactional email | Email address, message content | — (DPA available) |
| Sentry | Error tracking | Error context (no PII by config) | SOC 2 |

## Security controls (in code)

- **Authentication:** Supabase Auth (email/password). Passwords are hashed by
  Supabase (never stored by the app, never in plaintext, no hard-coded credentials).
- **Authorization:** Role-based (student / teacher / admin) via the `user_roles`
  table and `has_role(auth.uid(), …)`; routes guarded by `RoleProtectedRoute`;
  data guarded by RLS.
- **Secrets:** Provided via environment variables (`.env` is gitignored). The
  Supabase **service-role key is used only inside edge functions** (`Deno.env`),
  never shipped to the client. The client uses only the publishable/anon key.
- **Edge functions:** CORS allowlist (focustap.org, www, localhost); validate the
  caller's JWT (`auth.getClaims`) before performing privileged operations.
- **Transport:** HTTPS/TLS everywhere (Vercel + Supabase); `wss` for realtime.
- **At rest:** AES-256 encryption via Supabase/AWS.
- **Input validation:** `zod` + `react-hook-form`; parameterized Supabase queries
  (no raw SQL); React output escaping.
- **HTTP security headers** (`vercel.json`): HSTS, Content-Security-Policy,
  X-Content-Type-Options, X-Frame-Options (DENY), Referrer-Policy, Permissions-Policy
  (camera/microphone/geolocation/payment disabled — none are used).
- **No location/GPS, camera, microphone, or biometric capture.** Engagement is
  measured only as time-on-task (page visibility) — behavioral analytics, not
  surveillance.

## Privacy

- FERPA-aligned consent gate (`/consent`) before student data is processed.
- Privacy notice at `/privacy`; Terms at `/terms`. Entity: **FocusTap LLC**.
- Data minimization: name, email, institution/role, attendance, engagement
  signals, and user-authored notes only. No third-party tracking pixels or ad
  networks; cookies/local storage are used only for the authenticated session.
- Data is shared only with the user's own institution and instructors.

## Known gaps / roadmap (honest)

These are tracked in the HECVAT self-assessment and are in progress:

- **SSO / MFA / InCommon** — currently email/password only.
- **Org/policy artifacts** — SOC 2, BCP/DRP, incident-response plan, cyber
  insurance, formal security & privacy training.
- **Vulnerability management** — add SAST (CodeQL), dependency scanning
  (Dependabot/Snyk), and periodic external pen-testing.
- **Accessibility** — produce a VPAT/ACR and audit against WCAG 2.1 AA.

## Reporting a vulnerability

Email **reiss@focustap.org** with details and reproduction steps. We aim to
acknowledge within a few business days. Please do not publicly disclose until we
have remediated.
