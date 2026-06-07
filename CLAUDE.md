# FocusTap — Project Context

FocusTap is a browser-based classroom engagement and attendance platform. Students tap in via NFC or join a session link; professors see real-time focus tracking, engagement scores, and session reports. Piloting at Flagler College.

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Animations**: Framer Motion
- **Backend**: Supabase (Postgres + Row Level Security + Edge Functions on Deno)
- **Auth**: Supabase Auth (email/password, role-based via `user_roles` table)
- **State**: React Query (server state) + React hooks (local state)
- **Routing**: React Router v6
- **Email**: Resend (domain: focustap.org, verified)
- **Error tracking**: Sentry
- **Package Manager**: npm
- **Deploy**: Vercel (main branch → production)

## Project Structure
```
focustap/
├── src/
│   ├── pages/           # Route-level components
│   ├── components/      # Shared UI components
│   │   └── ui/          # shadcn/ui primitives
│   ├── hooks/           # Custom React hooks
│   ├── contexts/        # AuthContext, etc.
│   ├── lib/             # Pure logic (engagementScore.ts, financialData.ts)
│   ├── integrations/
│   │   └── supabase/    # client.ts + generated types
│   └── assets/          # Static assets (logo, images)
├── supabase/
│   ├── functions/       # Deno edge functions
│   └── migrations/      # SQL migrations (timestamped)
├── public/              # Static files served at root
├── CLAUDE.md            # This file
└── .claude/
    └── agents/          # Specialist subagents
```

## Key Domain Concepts
- **Session**: A professor launches a timed class session; students join via link or NFC
- **Student session**: A row in `student_sessions` tracking focus time, heartbeats, note saves
- **Focus events**: Rows in `focus_events` (start/pause/resume) used for distraction scoring
- **FEI (FocusTap Engagement Index)**: Proprietary engagement score. See the `fei-algorithm` skill for exact weights and calculation rules.
- **Institution**: A school (e.g. Flagler College) with `student_code` and `teacher_code` for signup gating
- **Roles**: `student`, `teacher`, `admin` — stored in `user_roles` table, enforced by RLS

## Key Files
- `src/lib/engagementScore.ts` — FEI algorithm
- `src/hooks/useHeartbeat.ts` — focus tracking heartbeat
- `src/components/NotesEditor.tsx` — TipTap rich text notes
- `src/pages/StudentSession.tsx` — student-facing session page
- `src/pages/TeacherDashboard.tsx` — professor dashboard
- `src/pages/SessionReport.tsx` — post-session analytics
- `src/contexts/AuthContext.tsx` — auth state + role checking
- `src/components/RoleProtectedRoute.tsx` — route guards
- `supabase/functions/assign-teacher-role/` — validates teacher_code, assigns role
- `supabase/functions/launch/` — creates session

## Commands
- `npm run dev` — start dev server (localhost:8080)
- `npm run build` — production build
- `npm run lint` — ESLint check
- `npx supabase db push` — push migrations to production Supabase

## Institutions
- Flagler College: `student_code = FLC-STU-2026`, `teacher_code = FLC-PROF-2026`

## Sub-Agents

See `.claude/agents/` — each agent's frontmatter `description` defines when to use it. Dispatch in parallel when 3+ tasks are independent with no shared files; otherwise sequential.

## Design System

Light mode across all pages. See the `design-system` skill (`.claude/skills/design-system/SKILL.md`) for tokens, card pattern, accents, and banned patterns.
