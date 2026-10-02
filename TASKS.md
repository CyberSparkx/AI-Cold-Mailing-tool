# AI Cold Mailing Tool — Task Management & Progress Checklist

Repository: `https://github.com/CyberSparkx/AI-Cold-Mailing-tool.git`

This checklist tracks the incremental progress of all architectural phases defined in `PROJECT_STRUCTURE.md`.

---

## Progress Overview

- [x] **Phase 0: Inspection & Repository Initialization**
  - [x] Inspect existing repo & agent instructions
  - [x] Initialize Git on `main` branch with remote origin
  - [x] Protect secrets via `.gitignore`
  - [x] Document environment variables in `.env.example`
  - [x] Setup `TASKS.md`

- [ ] **Phase 1: Project Setup & Foundation**
  - [ ] Initialize Next.js project with TypeScript strict, Tailwind CSS, Lucide icons
  - [ ] Configure `tsconfig.json`, `next.config.ts`, ESLint
  - [ ] Set up environment validation (`src/server/platform/config/env.ts` with Zod)
  - [ ] Implement application error classes and response utilities (`src/server/platform/errors/*`)
  - [ ] Implement logging framework with request ID context (`src/server/platform/logger/*`)
  - [ ] Implement route handler wrapper (`src/server/platform/http/*`)
  - [ ] Create dashboard shell & layout with sidebar, topbar, theme provider
  - [ ] Implement motion & smooth scroll providers (GSAP + Lenis wrappers)
  - [ ] Verify build, typecheck, and commit

- [ ] **Phase 2: Database Layer (Prisma + MongoDB)**
  - [ ] Define comprehensive Prisma schema in `prisma/schema.prisma`
  - [ ] Set up singleton Prisma client in `src/server/platform/db/prisma.ts`
  - [ ] Create repository base & skeletons for all core entities
  - [ ] Add database seeding / health verification utility
  - [ ] Verify Prisma generation, typecheck, commit & push

- [ ] **Phase 3: Authentication & Security Core**
  - [ ] Configure Auth.js (NextAuth v5) Google OAuth provider with JWT sessions
  - [ ] Implement `requireUser` server helper & `withAuth` route wrapper
  - [ ] Create token encryption/decryption using AES-256-GCM (`crypto/encrypt.ts`)
  - [ ] Create HMAC token utilities for unsubscribe links (`crypto/tokens.ts`)
  - [ ] Build `/login` authentication UI with premium design
  - [ ] Verify authentication flow & commit

- [ ] **Phase 4: Lead Generator Module**
  - [ ] Build provider abstraction interface & registry (`src/server/modules/leads/providers/*`)
  - [ ] Implement OpenStreetMap (Overpass) provider & CSV provider
  - [ ] Implement Lead normalizer, deduplication engine (`dedupeKey`), and syntax validators
  - [ ] Implement Lead repository & service (`lead.repository.ts`, `lead.service.ts`)
  - [ ] Build Lead API endpoints (`/api/leads`, `/api/leads/search`, `/api/leads/export`)
  - [ ] Build Lead Generator UI (`/dashboard/leads/new`) and Leads Table (`/dashboard/leads`)
  - [ ] Add CSV & Excel export capabilities
  - [ ] Test deduplication & lead management, commit & push

- [ ] **Phase 5: Google Integration (OAuth & Google Sheets)**
  - [ ] Implement incremental OAuth flow for Sheets & Gmail
  - [ ] Implement encrypted token storage & retrieval
  - [ ] Implement Google Sheets service (create, read, batched row update, column mapping)
  - [ ] Create `SheetSyncOutbox` write-behind queue logic
  - [ ] Build Google settings UI (`/dashboard/settings/google`)
  - [ ] Verify Google integration & commit

- [ ] **Phase 6: Cold Email Campaign System**
  - [ ] Implement Campaign repository, service, and Zod schemas
  - [ ] Implement Recipient snapshot importer (from Leads, CSV, Sheet)
  - [ ] Build Template engine with safe merge-field interpolation (`{{businessName}}`, etc.)
  - [ ] Implement Suppression service & Do-Not-Contact list (`/dashboard/settings/suppression`)
  - [ ] Implement public `/unsubscribe/[token]` handler & confirmation page
  - [ ] Build Campaign Wizard UI (`/dashboard/campaigns/new`) & Detail UI (`/dashboard/campaigns/[id]`)
  - [ ] Test campaign preview, template validation, and commit

- [ ] **Phase 7: Sending Pipeline & Daily Limit Engine**
  - [ ] Implement Gmail API sending service (MIME builder, custom Message-ID, List-Unsubscribe)
  - [ ] Implement 4-layer duplicate prevention (Mongo unique index, ContactLedger, atomic status claim, Redis lock)
  - [ ] Implement Daily sending limit engine (Mongo `DailySendCounter` + warm-up ramp)
  - [ ] Build guarded `send.service.ts` pipeline with audit & email logs
  - [ ] Test test-send mode, verify duplicate protection, commit & push

- [ ] **Phase 8: Redis & Background Worker Queue**
  - [ ] Set up Redis client (`src/server/platform/redis/client.ts`) & distributed lock
  - [ ] Implement BullMQ queue driver & queue definitions
  - [ ] Build worker processors: send-email, sheet-flush, inbox-sync, ai-classify, maintenance
  - [ ] Create worker entrypoint (`src/worker/index.ts`) & `Dockerfile.worker`
  - [ ] Verify queue processing & commit

- [ ] **Phase 9: Inbox & Opportunity Dashboard**
  - [ ] Implement Gmail read & incremental sync (`historyId`)
  - [ ] Implement deterministic pre-filter (ignore newsletters, automated emails, bounces)
  - [ ] Implement Inbox repository & service
  - [ ] Build Inbox Opportunity UI (`/dashboard/inbox`) with categorization & message drawer
  - [ ] Verify inbox pipeline & commit

- [ ] **Phase 10: AI Integration (Gemini + LangChain)**
  - [ ] Set up Gemini client factory with model tiering & token budget tracking (`AiUsage`)
  - [ ] Build email classification chain with structured Zod output
  - [ ] Build lead personalization chain (tailored 1-2 sentence observation)
  - [ ] Implement SHA-256 prompt content cache
  - [ ] Connect AI to inbox opportunity scoring & campaign personalization
  - [ ] Build AI usage & budget UI (`/dashboard/settings/ai`)
  - [ ] Test AI pipelines & commit

- [ ] **Phase 11: Analytics & Reporting**
  - [ ] Implement Analytics service with cached aggregates
  - [ ] Build Dashboard Overview (`/dashboard/overview`) with KPIs & active campaigns
  - [ ] Build Analytics page (`/dashboard/analytics`) with performance visualizations
  - [ ] Verify analytics & commit

- [ ] **Phase 12: Production Audit, Quality & Testing**
  - [ ] Write unit & integration tests with Vitest
  - [ ] Verify CSP, security headers, rate limiting, and input validation
  - [ ] Run full typecheck, lint, and build checks
  - [ ] Document setup & operational runbook in `README.md`
  - [ ] Final production audit, commit, and push
