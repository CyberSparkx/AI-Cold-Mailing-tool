# AI Cold Mailing Tool

A personal-use, high-conversion cold outreach operating system built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM (MongoDB)**, **Redis & BullMQ**, **Google OAuth / Gmail API**, and **Google Gemini AI via LangChain**.

Designed for solo founders, developers, and agency owners to discover high-value business leads, run personalized outreach sequences without risking Gmail domain reputation, and triage inbound opportunities with AI.

---

## 🏛️ System Architecture

The application is structured into **three strictly independent functional modules** connected only by a shared platform core:

```
src/
├── app/                              # Next.js App Router (UI & API handlers)
│   ├── (app)/dashboard/              # Authenticated SaaS Dashboard
│   │   ├── overview/                 # System Overview & real-time metrics
│   │   ├── leads/                    # Module 1: Lead Generator & Management
│   │   ├── campaigns/                # Module 2: Campaigns & Outreach
│   │   ├── inbox/                    # Module 3: Opportunity Inbox & Triage
│   │   ├── analytics/                # Performance Funnel & Conversions
│   │   └── settings/                 # Google, AI Budget, Suppression & Sender
│   └── api/                          # REST API Endpoints with Zod & Session Auth
├── server/
│   ├── modules/                      # Independent Domain Modules
│   │   ├── leads/                    # Discovery, OSM/Directory, Deduplication
│   │   ├── campaigns/                # Templates, 4-tier dedupe, Send limits
│   │   ├── inbox/                    # Gmail sync, Prefilter, AI triage
│   │   └── analytics/                # Aggregates, 7-day volume, Health scoring
│   ├── integrations/                 # External Service Adapters
│   │   ├── google/                   # Incremental OAuth, Token store, Sheets
│   │   └── ai/                       # Gemini Flash-Lite/Flash, LangChain, Caching
│   └── platform/                     # Cross-Cutting Infrastructure
│       ├── db/                       # Prisma MongoDB singleton
│       ├── redis/                    # ioredis connection & resilient mode
│       ├── queue/                    # BullMQ job driver & queue registry
│       ├── crypto/                   # AES-256-GCM tokens & HMAC signing
│       └── logger/                   # Pino structured JSON logging
└── worker/                           # Standalone Background Worker Entrypoint
    └── index.ts                      # BullMQ Processors (Campaign & Sheets)
```

---

## 🚀 Key Features

### 1. Lead Discovery Engine (`/dashboard/leads`)
* **Multi-Provider Search:** Query OpenStreetMap Overpass API and directory sources by business category, niche, country, state, city, and radius.
* **Automatic Lead Normalization:** Domain extraction (`example.com`), international phone normalization (E.164), and role-account detection (`sales@`, `info@`).
* **Multi-Attribute Deduplication:** Generates unique compound dedupe keys (`dom:`, `em:`, `ph:`, `geo:`) to prevent duplicates both within batches and against the database.
* **Export Options:** Direct one-click sync to Google Sheets or CSV download.

### 2. Cold Outreach Engine (`/dashboard/campaigns`)
* **4-Tier Duplicate Prevention Guard:**
  1. Unique database indices on `[campaignId, emailNormalized]`.
  2. `ContactLedger` table tracking cross-campaign outreach to prevent emailing the same contact twice.
  3. Atomic claim transition (`NOT_SENT` -> `CLAIMED`) before queuing to prevent worker race conditions.
  4. Redis distributed lock per recipient email during send execution.
* **CAN-SPAM & Anti-Abuse Safeguards:**
  * Automated RFC 8058 one-click unsubscribe header (`List-Unsubscribe: <https://.../unsubscribe/:token>`).
  * Cryptographic HMAC SHA-256 signed unsubscribe URLs with instant suppression recording.
  * Configurable physical postal address in email footer.
  * Deceptive subject line guard (blocks fake `"Re:"` / `"Fwd:"` prefixes on first touch).
* **Hard Daily Limits & Warm-up:**
  * Enforces maximum daily sending limit (default: 25 emails/day for fresh Gmail accounts) using atomic Redis counters and MongoDB records.

### 3. Background Processing (`worker/index.ts`)
* **BullMQ Queue Driver:** Outbound email sending and Google Sheets synchronization run completely decoupled from web request lifecycles.
* **Resilient Retry Policies:** Exponential backoff on transient Google API rate limits (`429` / `503`) while marking hard bounces immediately.

### 4. Opportunity Inbox (`/dashboard/inbox`)
* **Incremental Gmail Synchronization:** Synchronizes only new incoming emails using Gmail `historyId`.
* **Zero Body Bloat:** Fetches message headers and lightweight 200-character snippets rather than multi-megabyte raw HTML bodies.
* **Deterministic Cost-Saving Pre-Filter:** Automatically discards own sent messages, `no-reply` / automated notifications, newsletters (`List-Unsubscribe`), and out-of-office autoreplies without consuming AI tokens.

### 5. Gemini AI Integration (`/dashboard/settings/ai`)
* **Structured LangChain Classification:** Categorizes genuine prospect replies into actionable business categories:
  * `WEBSITE_INQUIRY`
  * `SOFTWARE_INQUIRY`
  * `FREELANCE_OPPORTUNITY`
  * `JOB_OPPORTUNITY`
  * `PARTNERSHIP`
  * `GENERAL`
* **Prompt Injection Defense:** Strict system prompt boundaries with untrusted email delimiters.
* **Token Budget & Cost Controls:** Monthly token caps with SHA-256 prompt response caching.
* **Zero Autonomous Replies:** AI assists the human user with triage; it is strictly prohibited from auto-replying to prospects.

---

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Framework | [Next.js 14](https://nextjs.org/) (App Router, Server Components) |
| Language | [TypeScript 5](https://www.typescriptlang.org/) (Strict Mode) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) with Design System Tokens |
| Database | [MongoDB](https://www.mongodb.com/) via [Prisma ORM 5](https://www.prisma.io/) |
| Queue & Cache | [Redis](https://redis.io/) via [ioredis](https://github.com/redis/ioredis) & [BullMQ](https://bullmq.io/) |
| Authentication | [NextAuth.js 4](https://next-auth.js.org/) (Google OAuth 2.0) |
| External APIs | [Google APIs](https://github.com/googleapis/google-api-nodejs-client) (Gmail, Sheets) |
| AI / LLM | [Google Gemini Flash](https://ai.google.dev/) via [@langchain/google-genai](https://js.langchain.com/) |
| Validation | [Zod 3](https://zod.dev/) |
| Testing | [Vitest 2](https://vitest.dev/) |

---

## ⚡ Quickstart & Local Development

### Prerequisites
* **Node.js** `>= 20.0.0`
* **npm** `>= 10.0.0`
* **MongoDB** (local replica set or MongoDB Atlas)
* **Redis** `>= 7.0` (local or Upstash/Redis Cloud)

### 1. Clone & Install
```bash
git clone https://github.com/CyberSparkx/AI-Cold-Mailing-tool.git
cd AI-Cold-Mailing-tool
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Fill in the necessary values:
```env
# MongoDB Connection URI
DATABASE_URL="mongodb://localhost:27017/cold_mailing_tool"

# NextAuth Secret & URL
NEXTAUTH_SECRET="your_nextauth_jwt_secret_32_chars_min"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Google OAuth (GCP Console Credentials)
GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# Cryptographic Keys (Must be 32 bytes hex for AES-256-GCM)
ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
UNSUBSCRIBE_SIGNING_KEY="your_hmac_signing_key_for_unsubscribe"

# Redis Connection URL
REDIS_URL="redis://localhost:6379"

# Google Gemini API Key
GEMINI_API_KEY="your_gemini_api_key"
```

### 3. Generate Prisma Client
```bash
npm run prisma:generate
```

### 4. Run the Web Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Run the Background Queue Worker
In a separate terminal:
```bash
npm run worker:dev
```

---

## 🧪 Testing & Verification

Run the test suite:
```bash
npm test
```

Run TypeScript strict type checking:
```bash
npm run typecheck
```

Run production build validation:
```bash
npm run build
npm run worker:build
```

---

## 🐳 Production Deployment

### Docker Multi-Stage Deployment
The repository includes container configurations for both the web application and the background worker.

#### 1. Background Worker (`Dockerfile.worker`):
```bash
docker build -f Dockerfile.worker -t cold-mail-worker .
docker run -d --env-file .env --name worker cold-mail-worker
```

---

## 🔒 Security & Anti-Abuse Standards

* **No Plaintext OAuth Secrets:** All Google refresh tokens are encrypted at rest with AES-256-GCM and stored with rotation key versioning.
* **Tenant Isolation:** Every database read, write, and background queue job strictly checks `userId` authorization.
* **Strict Email Delimitation:** Prompts containing untrusted email bodies are enclosed within distinct delimiter blocks and instruct the LLM never to follow instructions contained within email texts.
* **CAN-SPAM Act Compliance:** Automated postal address footers, valid return email headers, and instant one-click unsubscribe links.

---

## 👤 Author
* **Naren Roy** — [Portfolio](https://narenroy.in/)
