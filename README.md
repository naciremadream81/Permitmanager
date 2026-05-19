# PermitPro

**End-to-end permit lifecycle management**

PermitPro is a full-stack SaaS platform for managing construction and development permits from application through final inspection. It replaces fragmented spreadsheets, email chains, and paper-based workflows with a unified system that tracks every permit, deadline, document, and stakeholder interaction in one place.

The platform is built for permit expeditors, general contractors, and municipalities who need real-time visibility into permit status, automated deadline tracking, and AI-assisted document processing. It includes a web dashboard, a mobile field app for inspectors and site supervisors, and an Electron desktop client for power users who work offline.

The AI layer (powered by GPT-4o) processes uploaded permit documents, extracts key data fields, scores application risk, and surfaces actionable insights — reducing manual review time and improving submission approval rates.

---

## Monorepo Structure

```
PermitManager/
├── apps/
│   ├── web/                  # Next.js 14 web application (App Router)
│   ├── mobile/               # Expo React Native app (iOS + Android)
│   └── desktop/              # Electron desktop client
├── packages/
│   ├── shared/               # Shared types, schemas (Zod), and constants
│   ├── ui-web/               # Shadcn/ui component library for web
│   ├── ui-mobile/            # React Native component library for mobile
│   ├── permit-engine/        # Core business logic: status machine, deadlines, risk scoring
│   ├── ai/                   # AI utilities: document processor, conversation engine
│   └── config/               # Shared ESLint, TypeScript, and Tailwind base configs
├── prisma/
│   └── schema.prisma         # Prisma schema (PostgreSQL)
├── .github/
│   └── workflows/            # CI/CD GitHub Actions
├── Dockerfile                # Multi-stage Docker build for the web app
├── docker-compose.yml        # Local dev stack: PostgreSQL, Redis, Typesense
├── vercel.json               # Vercel deployment configuration
├── turbo.json                # Turborepo pipeline config
├── pnpm-workspace.yaml       # pnpm workspace definition
└── .env.example              # All environment variables with descriptions
```

---

## Tech Stack

**Web (`apps/web`)**
- Next.js 14 with App Router and React Server Components
- Tailwind CSS + Shadcn/ui for the component layer
- Supabase for authentication (email/password, magic link, OAuth)
- Prisma ORM against PostgreSQL (via Supabase)
- Stripe for subscription billing
- Resend for transactional email
- Typesense for full-text permit search
- Upstash Redis for rate limiting and caching
- Sentry for error tracking and performance monitoring
- OpenAI GPT-4o for AI-assisted document review

**Mobile (`apps/mobile`)**
- Expo SDK with Expo Router (file-based navigation)
- React Native with TypeScript
- Expo Camera, Document Picker, Secure Store, and Local Authentication
- RevenueCat for in-app purchases and subscription management
- EAS Build and EAS Submit for CI/CD to app stores

**Desktop (`apps/desktop`)**
- Electron with a shared React component layer

**Infrastructure**
- Vercel for web hosting and edge functions
- Supabase for the managed PostgreSQL database and object storage
- Docker + Docker Compose for local development
- GitHub Actions for CI, preview deployments, and mobile releases
- Turborepo for monorepo task orchestration with remote caching

---

## Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0 (`npm install -g pnpm@9.5.0`)
- **Docker** (for the local dev stack: PostgreSQL, Redis, Typesense)
- **Supabase account** — create a free project at supabase.com
- **OpenAI API key** — from platform.openai.com/api-keys

Optional for full feature parity:
- Stripe account (payments)
- Resend account (email)
- Upstash account (Redis)
- Sentry project (error tracking)
- Expo account + EAS CLI (mobile builds)

---

## Quick Start

```bash
# 1. Clone the repo and install dependencies
git clone https://github.com/your-org/permitpro.git && cd permitpro && pnpm install

# 2. Copy the environment file and fill in your values
cp .env.example .env

# 3. Start the local infrastructure (PostgreSQL, Redis, Typesense)
docker compose up -d postgres redis typesense

# 4. Run database migrations and seed data
pnpm prisma migrate dev && pnpm prisma db seed

# 5. Start the web app
pnpm dev --filter=@permitpro/web
```

Open http://localhost:3000.

---

## Development Guide

**Web app only**
```bash
pnpm dev --filter=@permitpro/web
```
Runs Next.js on http://localhost:3000 with hot reload.

**Mobile app only**
```bash
pnpm dev --filter=@permitpro/mobile
```
Starts the Expo Metro bundler. Scan the QR code with Expo Go (iOS/Android) or press `i` for iOS simulator / `a` for Android emulator.

**All apps and packages**
```bash
pnpm dev
```
Turborepo runs all `dev` scripts in parallel. Note: the desktop Electron app opens a native window.

**Build everything**
```bash
pnpm build
```

**Type checking**
```bash
pnpm typecheck
```

**Lint**
```bash
pnpm lint
```

**Format**
```bash
pnpm format
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in all values before running the app. Variables prefixed `NEXT_PUBLIC_` are bundled into the browser. Variables prefixed `EXPO_PUBLIC_` are bundled into the mobile app. All others are server-side only.

### Application

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Public-facing URL of the web application. `http://localhost:3000` for local dev; your Vercel URL in production. |

### Supabase (Auth & Storage)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL from Supabase dashboard → Settings → API. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon (public) key. Safe to expose in the browser — enforces Row Level Security. |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key. Server-side only. Bypasses RLS — never expose to the client. |
| `SUPABASE_JWT_SECRET` | JWT secret used to verify Supabase-issued tokens. Found in Supabase dashboard → Settings → API. |

### Database (Prisma)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string with `?pgbouncer=true` for connection pooling via PgBouncer. Use Supabase's pooled connection string (port 6543). |
| `DIRECT_URL` | Direct PostgreSQL connection (port 5432). Used by Prisma Migrate to bypass PgBouncer — required for DDL operations. |

### OpenAI (AI Features)

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | API key from platform.openai.com/api-keys. |
| `OPENAI_MODEL` | Model for AI completions. Defaults to `gpt-4o`. Can be set to `gpt-4o-mini` to reduce costs. |

### Stripe (Payments & Billing)

| Variable | Description |
|---|---|
| `STRIPE_SECRET_KEY` | Secret key from Stripe dashboard → Developers → API keys. Use `sk_test_...` for development. |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret from Stripe dashboard → Webhooks. Required to validate incoming webhook events. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Publishable key, safe for the browser. Use `pk_test_...` for development. |
| `STRIPE_PRICE_PRO` | Stripe Price ID for the Pro subscription tier (e.g., `price_...`). |
| `STRIPE_PRICE_ENTERPRISE` | Stripe Price ID for the Enterprise subscription tier. |

### Resend (Transactional Email)

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | API key from resend.com/api-keys. |
| `EMAIL_FROM` | Sender address for all outbound email. Must be a verified domain in Resend (e.g., `notifications@permitpro.app`). |

### Upstash Redis (Rate Limiting & Caching)

| Variable | Description |
|---|---|
| `UPSTASH_REDIS_REST_URL` | REST URL from the Upstash console (e.g., `https://your-redis.upstash.io`). |
| `UPSTASH_REDIS_REST_TOKEN` | REST token from the Upstash console. Server-side only. |

### Typesense (Full-Text Search)

| Variable | Description |
|---|---|
| `TYPESENSE_HOST` | Typesense server hostname. `localhost` for local Docker, or your Typesense Cloud host. |
| `TYPESENSE_API_KEY` | Admin API key for indexing and searching. The local Docker default is `permitpro-typesense-dev-key`. |
| `TYPESENSE_PORT` | Typesense port. Default `8108`. |
| `TYPESENSE_PROTOCOL` | `http` for local Docker, `https` for Typesense Cloud. |

### Sentry (Error Tracking)

| Variable | Description |
|---|---|
| `SENTRY_DSN` | DSN from your Sentry project settings. Required for error reporting in all environments. |
| `SENTRY_AUTH_TOKEN` | Auth token for uploading source maps during build. Obtain from Sentry → Settings → Auth Tokens. |
| `SENTRY_ORG` | Your Sentry organization slug. |
| `SENTRY_PROJECT` | Your Sentry project slug (e.g., `permitpro-web`). |

### Vercel Analytics

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_VERCEL_ANALYTICS_ID` | Analytics ID. Automatically set by Vercel for projects with Analytics enabled. Leave blank for local dev. |

### Mobile App (Expo)

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_API_URL` | Base URL for the API that the mobile app calls. Points to your deployed web app URL in production. |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL for the mobile app. Can match `NEXT_PUBLIC_SUPABASE_URL`. |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key for the mobile app. Can match `NEXT_PUBLIC_SUPABASE_ANON_KEY`. |
| `EXPO_PUBLIC_REVENUECAT_API_KEY` | RevenueCat API key for in-app purchase management (iOS: `appl_...`, Android: `goog_...`). |

### Background Jobs

| Variable | Description |
|---|---|
| `CRON_SECRET` | Secret token used to authenticate requests to cron job endpoints. Must be at least 32 characters. Set this in your Vercel cron configuration. |

### S3-Compatible Storage

| Variable | Description |
|---|---|
| `S3_BUCKET` | Bucket name for permit document storage (e.g., `permitpro-documents`). |
| `S3_REGION` | AWS region or compatible provider region (e.g., `us-east-1`). |
| `S3_ACCESS_KEY` | AWS access key ID or compatible provider key. |
| `S3_SECRET_KEY` | AWS secret access key or compatible provider secret. |

---

## Database Guide

The Prisma schema lives at `prisma/schema.prisma`. The web app uses two connection strings: `DATABASE_URL` for the pooled connection (runtime queries) and `DIRECT_URL` for migrations (direct connection to bypass PgBouncer).

**Run all pending migrations**
```bash
pnpm prisma migrate dev
```
Creates a new migration file and applies it. Use this during development when you change the schema.

**Apply migrations in production (non-interactive)**
```bash
pnpm prisma migrate deploy
```
Used by the `db-migrate.yml` GitHub Actions workflow. Never runs `migrate dev` in production.

**Seed the database**
```bash
pnpm prisma db seed
```
Populates the database with initial data (permit types, status definitions, a demo organization, and a seed admin user).

**Open Prisma Studio**
```bash
pnpm prisma studio
```
Opens a visual database browser at http://localhost:5555.

**Generate the Prisma client after schema changes**
```bash
pnpm prisma generate
```
This runs automatically as part of `prisma migrate dev`, but run it manually if you pull schema changes without running migrations.

**Reset the database (destructive — dev only)**
```bash
pnpm prisma migrate reset
```
Drops the database, re-runs all migrations, and re-seeds. Never use in staging or production.

---

## Deployment

### Web — Vercel

The web app deploys to Vercel. The `vercel.json` at the repo root configures the build command, function timeouts, security headers, and rewrites.

1. Install the Vercel CLI: `npm install -g vercel`
2. Link the project: `vercel link`
3. Add all required environment variables in the Vercel dashboard (Settings → Environment Variables). Use the values from your production `.env`.
4. Push to `main` — the `deploy-web.yml` workflow runs automatically.

For manual deploys:
```bash
vercel --prod
```

**Preview deployments** are created automatically for every pull request by the `preview.yml` workflow. The preview URL is posted as a PR comment.

### Mobile — EAS Build

Mobile builds use Expo Application Services (EAS).

**Install EAS CLI**
```bash
npm install -g eas-cli
eas login
```

**Configure the project** (first time only)
```bash
cd apps/mobile
eas build:configure
```

**Build for development** (internal distribution, simulator-compatible)
```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

**Build a preview APK** (for internal testers)
```bash
eas build --profile preview --platform android
```

**Build for production and submit to app stores**
```bash
eas build --profile production --platform all
eas submit --platform all
```

Production builds and store submissions run automatically via `release-mobile.yml` when a tag matching `v*.*.*` is pushed:
```bash
git tag v1.2.0 && git push --tags
```

Before the first production submission, fill in the `submit.production` values in `apps/mobile/eas.json` with your Apple ID, App Store Connect App ID, and Apple Team ID.

---

## Architecture Overview

```
                        ┌─────────────────────────────────────────┐
                        │              Client Layer                │
                        │                                         │
                        │  ┌──────────┐  ┌────────┐  ┌────────┐  │
                        │  │ Next.js  │  │ Expo   │  │Electron│  │
                        │  │  (web)   │  │(mobile)│  │(desktop│  │
                        │  └────┬─────┘  └───┬────┘  └───┬────┘  │
                        └───────┼────────────┼───────────┼───────┘
                                │            │           │
                        ┌───────▼────────────▼───────────▼───────┐
                        │           Next.js API Routes            │
                        │         (Vercel Edge / Serverless)       │
                        │                                         │
                        │  /api/permits    /api/documents          │
                        │  /api/ai         /api/webhooks           │
                        │  /api/auth       /api/health             │
                        └────┬──────┬──────┬──────┬───────────────┘
                             │      │      │      │
               ┌─────────────▼─┐  ┌─▼──┐  │  ┌──▼──────────┐
               │   Supabase    │  │AI  │  │  │   Stripe    │
               │  (Auth + DB   │  │(GPT│  │  │  (Billing)  │
               │  + Storage)   │  │-4o)│  │  └─────────────┘
               └───────┬───────┘  └────┘  │
                       │                  │
               ┌───────▼──────┐   ┌───────▼──────┐
               │  PostgreSQL  │   │    Upstash   │
               │  (via Prisma)│   │    Redis     │
               └──────────────┘   └──────────────┘
                                          │
                                  ┌───────▼──────┐
                                  │  Typesense   │
                                  │  (Search)    │
                                  └──────────────┘
```

**Data flow for a permit submission:**
1. User submits a permit application via the web dashboard or mobile app.
2. The Next.js API route validates the payload against the Zod schemas in `@permitpro/shared`.
3. The `@permitpro/permit-engine` status machine transitions the permit to `SUBMITTED`.
4. The deadline engine calculates review deadlines and schedules notification jobs.
5. Uploaded documents are stored in Supabase Storage (S3-compatible) and processed by the AI document processor in `@permitpro/ai`.
6. The AI layer extracts key fields, scores risk, and attaches structured metadata to the permit record.
7. The permit record is written to PostgreSQL via Prisma and indexed in Typesense for search.
8. Notifications are sent via Resend to relevant stakeholders.

---

## GitHub Actions Secrets

Before the CI/CD pipelines can run end-to-end, configure these secrets in your GitHub repository (Settings → Secrets and variables → Actions):

**Required for all workflows**
- `VERCEL_TOKEN` — Vercel personal access token (vercel.com/account/tokens)

**Required for production deploys (`deploy-web.yml`)**
- All secrets from the "Deployment" environment in Vercel are injected automatically at build time via `vercel pull`. No additional GitHub secrets needed beyond `VERCEL_TOKEN` for the web deploy — set variables in the Vercel dashboard, not in GitHub.

**Required for database migrations (`db-migrate.yml`)**
- `DATABASE_URL` — set as a secret in the `production` and `staging` GitHub environments

**Required for mobile releases (`release-mobile.yml`)**
- `EXPO_TOKEN` — EAS personal access token (expo.dev/accounts/[username]/settings/access-tokens)
- `APPLE_APP_SPECIFIC_PASSWORD` — app-specific password for App Store Connect submission (appleid.apple.com → Security)

---

## Contributing

**Branch naming**

| Type | Pattern | Example |
|---|---|---|
| Feature | `feat/short-description` | `feat/ai-document-review` |
| Bug fix | `fix/short-description` | `fix/deadline-off-by-one` |
| Chore / refactor | `chore/description` | `chore/upgrade-prisma-6` |
| Hotfix | `hotfix/description` | `hotfix/stripe-webhook-500` |

**Commit convention**

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(permits): add bulk status update endpoint
fix(ai): handle empty document gracefully
chore(deps): upgrade turbo to 2.1.0
docs(readme): add EAS build instructions
```

Types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `perf`, `ci`

**Pull request process**

1. Branch off `develop` (not `main`).
2. Open a PR against `develop`. The `ci.yml` workflow runs typecheck, lint, unit tests, and a build check automatically.
3. The `preview.yml` workflow deploys a Vercel preview and posts the URL to the PR.
4. Request review from at least one other engineer.
5. Squash merge to `develop` when approved.
6. `develop` is merged to `main` for production releases. Pushing to `main` triggers `deploy-web.yml`.
7. Mobile releases are cut by tagging `main`: `git tag v1.x.x && git push --tags`.

**Local checks before pushing**

```bash
pnpm typecheck && pnpm lint && pnpm build
```
