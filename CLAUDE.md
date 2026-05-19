# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
pnpm install

# Start local infrastructure (PostgreSQL, Redis, Typesense)
docker compose up -d postgres redis typesense

# Development
pnpm dev                              # All apps in parallel
pnpm dev:web                          # Web only (http://localhost:3000)
pnpm dev:mobile                       # Expo Metro bundler
pnpm dev:desktop                      # Electron

# Type checking, linting, formatting
pnpm typecheck
pnpm lint
pnpm format

# Build everything
pnpm build

# Tests
pnpm test
pnpm test --filter=@permitpro/shared  # Single package

# Database
pnpm prisma migrate dev               # Create + apply migration (dev only)
pnpm prisma migrate deploy            # Apply migrations in production
pnpm prisma db seed                   # Seed demo data
pnpm prisma generate                  # Regenerate client after schema pull
pnpm prisma studio                    # Visual DB browser at :5555
pnpm prisma migrate reset             # Drop + re-seed (dev only, destructive)
```

All `turbo` tasks respect build order: packages must build before consumers. `typecheck` and `lint` depend on `^build`, so running them at the root builds all packages first.

## Architecture

### Monorepo layout

```
apps/web           Next.js 14 App Router — the primary product UI + API
apps/mobile        Expo React Native (iOS + Android)
apps/desktop       Electron
packages/shared    Single source of truth: TypeScript types, Zod schemas, constants
packages/permit-engine  Core business logic (no framework dependencies)
packages/ai        OpenAI GPT-4o wrappers
packages/ui-web    Shadcn/ui component library (consumed by apps/web)
packages/config    Shared ESLint, TypeScript base, Tailwind base configs
prisma/            Prisma schema + seed (shared by all apps via apps/web's DB connection)
```

### Data layer

- **Prisma + PostgreSQL** (via Supabase) is the database. `apps/web` owns the Prisma client singleton at `src/lib/prisma.ts`. Two connection strings: `DATABASE_URL` (pooled via PgBouncer, port 6543, for runtime) and `DIRECT_URL` (port 5432, for Prisma Migrate DDL).
- **Supabase** handles auth (magic link OTP). The web app has three Supabase client helpers: `src/lib/supabase/server.ts` (Server Components/Route Handlers), `src/lib/supabase/client.ts` (browser), `src/lib/supabase/middleware.ts` (session refresh). The middleware at `src/middleware.ts` refreshes the Supabase session on every request.
- **Typesense** is used for full-text search across permits.
- **Upstash Redis** is used for rate limiting and caching.
- **Supabase Storage** (S3-compatible) stores permit documents; env vars `S3_BUCKET`, `S3_REGION`, etc. configure it.

### Authentication and API pattern

All API routes follow the same pattern:

```typescript
const auth = await requireAuth();      // Returns AuthContext | NextResponse(401/403)
if (!isAuthContext(auth)) return auth; // Early return on unauthenticated/no-org
```

`requireAuth()` (at `src/lib/api/auth.ts`) validates the Supabase session, upserts the user in Prisma, and fetches the user's first active `OrgMembership`. All data queries are scoped to `auth.orgId`. The `AuthContext` carries `userId`, `email`, `orgId`, `role`, and `name`.

Error handling uses `handleApiError(error)` which maps ZodErrors → 400, Prisma not-found → 404, unique constraint → 409. Helpers `notFound()`, `forbidden()`, `badRequest()` return pre-shaped NextResponse objects.

Audit trail: every mutation calls `logActivity()` from `src/lib/api/audit.ts`. Audit failures are swallowed with `console.error` — they must never crash the main request.

### Shared package (`@permitpro/shared`)

This is the contract layer. Import from it in all apps and packages:

```typescript
import type { Permit, PermitWithRelations, PermitListItem } from '@permitpro/shared';
import { PERMIT_STATUS_CONFIG, PERMIT_TYPE_CONFIG, PERMIT_STATUS_TRANSITIONS } from '@permitpro/shared';
import { CreatePermitSchema, UpdatePermitSchema } from '@permitpro/shared';
```

- **Types** (`src/types/index.ts`): All entity interfaces mirror the Prisma schema. Use `PermitWithRelations` for detail views, `PermitListItem` for lists (includes `_count`).
- **Schemas** (`src/schemas/index.ts`): Zod schemas for all create/update operations and query filters. API routes parse request bodies and query params against these.
- **Constants** (`src/constants/index.ts`): `PERMIT_STATUS_CONFIG` and `PERMIT_TYPE_CONFIG` contain labels, Tailwind color classes, and Lucide icon names for every enum value. Use these for all status badge rendering — do not hardcode colors. `PERMIT_STATUS_TRANSITIONS` defines the allowed state machine edges.

### Permit engine (`@permitpro/permit-engine`)

Pure business logic, no framework deps:

- `statusMachine.ts` — `validateTransition(from, to)` must be called before every status update. `isTerminalStatus()`, `getAvailableTransitions()`, `isActiveStatus()`.
- `riskScorer.ts` — `calculateRiskScore(permit, documents, checklistItems, inspections)` returns a 0–100 score with factor breakdown. Thresholds: low < 30, medium < 60, high < 80, critical ≥ 80.
- `deadlineEngine.ts` — deadline calculation logic.
- `completionCalculator.ts` — `completionPercentage` computation.

### AI package (`@permitpro/ai`)

All modules wrap OpenAI GPT-4o:

- `conversationEngine.ts` — `buildPermitContext(...)` assembles a context string from permit relations; `streamChat({ messages, permitContext, onChunk })` streams SSE chunks. The `/api/permits/[id]/ai` route uses this directly.
- `documentProcessor.ts` — extracts structured fields from uploaded documents.
- `checklistGenerator.ts` — generates checklist items for a permit type/jurisdiction.
- `insightEngine.ts` — surfaces dashboard insights.
- `permitSummarizer.ts` — AI narrative summary for the permit detail page.
- `riskScorer.ts` — AI-augmented risk analysis (distinct from the deterministic engine scorer).

### Web app routing

The Next.js app uses two route groups:

- `(auth)/` — unauthenticated routes (login page, auth callback)
- `(dashboard)/` — authenticated shell with sidebar + topbar layout

The existing dashboard stub at `app/dashboard/page.tsx` redirects to `/login` if unauthenticated. New dashboard pages should go under `app/(dashboard)/`.

The AI chat endpoint (`/api/permits/[id]/ai`) returns `text/event-stream` SSE with the format `data: {"content": "...chunk..."}\n\n` and terminates with `data: [DONE]\n\n`.

### Design system

- Primary: Navy `#0F2044` (`navy-900` in Tailwind)
- Accent: Amber `#F59E0B` (`amber-500`)
- Fonts: `DM Sans` (body, `font-sans`), `Fraunces` (display/headings, `font-display`)
- Tailwind config extends the base from `@permitpro/config/tailwind.base` and adds custom `navy` and `amber` color scales
- Shadcn/ui components are the UI building blocks; Radix UI primitives are already installed
- Icons: Lucide React (`lucide-react`)
- `PERMIT_STATUS_CONFIG[status].bgColor` and `.textColor` are Tailwind class strings ready to use in `className`

### Key constraints

- `use client` only when actually needed — prefer React Server Components
- No `any` types — use types from `@permitpro/shared`
- All API calls must scope data to `auth.orgId`
- Document uploads are capped at 50 MB (`MAX_FILE_SIZE_BYTES`); allowed types are in `ALLOWED_DOCUMENT_MIME_TYPES`
- Subscription limits: Free = 1 seat / 5 permits, Pro = 10 seats / 100 permits, Enterprise = unlimited (`SUBSCRIPTION_PLANS`)
- Cron endpoint at `/api/cron/scan-deadlines` is authenticated via `CRON_SECRET` header

### Branch and commit conventions

- Branch off `develop`, PR into `develop`, squash merge
- `main` is production — pushing triggers `deploy-web.yml`
- Mobile releases: tag `main` with `v*.*.*` to trigger EAS build + store submission
- Commit format: `feat(scope): message` | `fix(scope): message` | `chore/docs/test/refactor/perf/ci`
