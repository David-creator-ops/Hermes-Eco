# Hermes Eco — Agent Registry & Discovery Platform

A full-stack marketplace and discovery platform for AI agents built on the Hermes Agent framework. Browse, search, verify, and submit agents, skills, tools, workflows, integrations, memory systems, model configs, and routers — all in one hub.

---

## Features

- **Public Registry** — Browse and search all resources with filters (type, category, complexity, deployment)
- **Automatic Verification** — GitHub crawler discovers repos with `.hermeseco.json` files and scores them on 8-point checks
- **Featured Listings** — Users can pay (Solana USDC) to get their project highlighted with a gold badge across the platform
- **Admin Console** — Full moderation dashboard with analytics, submission management, featured requests, crawler control, and user management
- **Submission System** — Web form for manual submissions + automatic GitHub crawling
- **Dark, Minimal UI** — Linear/Vercel-inspired design, compact spacing, responsive

---

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 19, Vite 6, Tailwind CSS 3, TypeScript, React Query, React Router, Lucide Icons |
| Backend | Node.js, Express, TypeScript, SQLite (better-sqlite3) |
| Crawler | Node.js CLI, GitHub Code Search API |
| CI/CD | GitHub Actions (daily crawl schedule) |
| Password Security | bcrypt (12 rounds), session tokens |
| Input Security | HTML sanitization, URL/email validation, rate limiting |

---

## Project Structure

```
├── frontend/                    # React SPA
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.tsx           # Landing page with hero, stats, browse grid, featured, CTA
│   │   │   ├── BrowsePage.tsx         # Full resource search + filters + featured distribution
│   │   │   ├── AgentDetailPage.tsx    # Individual resource view with verification checks
│   │   │   ├── CategoryPage.tsx       # Filtered view by category
│   │   │   ├── SubmitPage.tsx         # Manual submission form
│   │   │   ├── GetFeaturedPage.tsx    # Featured request form + crypto payment info
│   │   │   ├── AdminConsole.tsx       # Full admin dashboard (6+ pages)
│   │   │   ├── NotFoundPage.tsx       # 404 error page
│   │   │   └── ErrorPage.tsx          # 500 error page
│   │   ├── components/
│   │   │   ├── agent/AgentCard.tsx    # Resource card (supports featured gold styling)
│   │   │   ├── layout/                # Header, Footer, Layout shell
│   │   │   └── search/                # SearchBar, FilterSidebar
│   │   ├── services/api.ts            # API client
│   │   └── types/                     # TypeScript interfaces
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.ts
│
├── backend/                     # Express API
│   ├── src/
│   │   ├── routes/
│   │   │   ├── agentRoutes.ts           # Public agent listing + detail
│   │   │   ├── categoryRoutes.ts        # Categories
│   │   │   ├── statsRoutes.ts           # Ecosystem stats
│   │   │   ├── submissionRoutes.ts      # Manual + featured submissions (with sanitization)
│   │   │   ├── crawlerRoutes.ts         # Crawler upsert endpoint
│   │   │   └── adminRoutes.ts           # Full admin API (auth, dashboard, settings, etc.)
│   │   ├── services/
│   │   │   ├── adminService.ts          # Auth (bcrypt), sessions, audit logging
│   │   │   ├── agentService.ts          # Agent queries
│   │   │   ├── categoryService.ts       # Category queries
│   │   │   └── statsService.ts          # Stats aggregation
│   │   ├── controllers/               # Express controllers
│   │   ├── db/
│   │   │   ├── migrate.ts             # Schema definition (run to create tables)
│   │   │   ├── seed.ts                # Seed data (13 sample resources + 3 admin users)
│   │   │   └── pool.ts                # SQLite connection
│   │   ├── middleware/
│   │   │   └── errorHandler.ts        # Global error handler
│   │   └── utils/
│   │       └── sanitize.ts            # Input sanitization (HTML strip, URL/email validation)
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── hermes.db            # SQLite database (created by migration, not in git)
│
├── crawler/                   # Discovery engine
│   ├── scripts/
│   │   └── crawl-hermes-agents.js     # GitHub crawler script
│   └── .github/workflows/
│       └── crawl-registry.yml         # GitHub Actions config (runs daily at 2 AM UTC)
│
├── shared/                    # Shared types
│   └── types.ts
├── docs/                      # Documentation
│   └── original-dashboard-design.md   # Original admin design reference
├── package.json               # Root workspace config
├── package-lock.json
└── .gitignore
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm

### 1. Install Dependencies
```bash
cd hermes-agent-registry
npm install
```

### 2. Configure Environment
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your values:
#   PORT=3001
#   NODE_ENV=development
#   GITHUB_TOKEN=your_github_token     # Required for crawler
#   ADMIN_SESSION_SECRET=change_this   # Session token signing
```

### 3. Initialize Database
```bash
cd backend
npx tsx src/db/migrate.ts    # Creates all tables
npx tsx src/db/seed.ts       # Seeds 13 resources + 3 admin users
```

### 4. Start Servers
```bash
# Terminal 1 - Backend (port 3001)
cd backend
npx tsx watch src/index.ts

# Terminal 2 - Frontend (port 5174)
cd frontend
npx vite
```

Open http://localhost:5174

### 5. Verify Everything
```bash
curl http://localhost:3001/api/health
# Expected: {"status":"ok","timestamp":"...","env":"development"}
```

---

## Admin Console

| Account | Username | Password | Role | Access |
|---------|----------|----------|------|--------|
| Super Admin | admin | hermes2026 | super_admin | Everything |
| Moderator | moderator | mod2026 | moderator | Submissions, Resources, Featured, Crawler |
| Analyst | ops | ops2026 | analyst | Dashboard, Crawler, Audit Log |

**Access:** http://localhost:5174/console

**Pages:**
- **Dashboard** — Analytics overview: total resources, pending reviews, verified count, featured count, avg stars, active users, verification breakdown, top resources, submission sources, activity feed
- **Submissions** — Approve/reject user submissions
- **Resources** — Browse, search, archive, and toggle featured on individual resources
- **Featured** — Manage featured requests (approve, reject, mark as paid)
- **Crawler** — Trigger manual crawls, configure GitHub token, rate limits, schedule
- **Settings** — Solana USDC wallet, featured price, CTA text, crawler config, GitHub token
- **Users** — Admin user management (add, enable/disable)
- **Audit Log** — Full audit trail of all admin actions

---

## Submission System

### Method 1: Manual Web Form
1. Users go to `/submit`
2. Fill in: resource name, type, GitHub URL, description, author, license, category
3. Submitted to `submissions` table as "pending"
4. Admin reviews in console → approve (copies to `agents` table) or reject

### Method 2: Automatic GitHub Crawler
1. User adds `.hermeseco.json` to their repo root:
```json
{
  "name": "My Cool Agent",
  "type": "agent",
  "description": "Description of the agent",
  "author": "github-username",
  "repository": "https://github.com/username/repo",
  "category": "automation",
  "license": "MIT"
}
```

2. Crawler discovers it via GitHub Code Search, runs 8 verification checks:

| Check | Description |
|-------|-------------|
| Valid metadata | `.hermeseco.json` exists and parses |
| Not a fork | Original repository |
| Hermes dependency | package.json/requirements.txt references Hermes |
| Hermes imports | Code imports from Hermes |
| README mentions Hermes | Contains Hermes keyword |
| Has tests | tests/ directory exists |
| Has license | LICENSE file present |
| README detailed | Installation & usage instructions |

3. Score: 0–1. ≥0.75 = verified, ≥0.50 = unverified, <0.50 = rejected
4. Resources are automatically added to the registry

### Method 3: Featured Request (Paid)
1. Users go to `/featured`
2. See wallet address (Solana USDC) and price
3. Send payment, fill in form (resource name, GitHub URL, email, message)
4. Admin sees request in console → verify payment → approve → resource gets gold badge

---

## API Endpoints

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/agents` | List agents with filters (`?resource_type=agent&category_slug=automation&complexity_level=intermediate`) |
| GET | `/api/agents/featured` | Featured agents |
| GET | `/api/agents/recent` | Recently added agents |
| GET | `/api/agents/slug/:slug` | Single agent by slug |
| GET | `/api/categories` | All categories |
| GET | `/api/stats` | Ecosystem statistics (totals, breakdowns) |

### Submissions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/submit` | None | Manual submission form (sanitized) |
| POST | `/api/submit/batch` | None | Bulk submission (crawler) |
| POST | `/api/submit/featured` | None | Featured request form |
| GET | `/api/submit/featured` | None | Get wallet address + pricing |

### Crawler

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/crawler/upsert` | None | Upsert agent (from crawler script) |

### Admin (all require Bearer token)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/console/auth/login` | Admin login |
| GET | `/api/console/dashboard` | Dashboard analytics |
| GET | `/api/console/submissions` | List submissions (`?status=pending&limit=30&page=1`) |
| POST | `/api/console/submissions/:id/approve` | Approve submission |
| POST | `/api/console/submissions/:id/reject` | Reject submission |
| GET | `/api/console/resources` | List resources (`?search=query&limit=30&page=1`) |
| POST | `/api/console/resources/:id/toggle-featured` | Toggle featured status |
| POST | `/api/console/resources/:id/archive` | Archive a resource |
| GET | `/api/console/featured-requests` | All featured requests (`?status=pending`) |
| POST | `/api/console/featured-requests/:id/approve` | Approve and feature |
| POST | `/api/console/featured-requests/:id/reject` | Reject featured request |
| POST | `/api/console/featured-requests/:id/toggle-paid` | Mark/unmark as paid |
| GET | `/api/console/crawler/settings` | Crawler configuration |
| POST | `/api/console/crawler/settings` | Update crawler settings |
| POST | `/api/console/crawler/run` | Trigger manual crawl |
| GET | `/api/console/settings` | General settings |
| POST | `/api/console/settings` | Update settings |
| GET | `/api/console/users` | List admin users |
| POST | `/api/console/users` | Create admin user |
| POST | `/api/console/users/:id/toggle-active` | Enable/disable user |
| GET | `/api/console/audit-logs` | Audit trail (`?page=1&limit=50`) |

---

## Security Features

| Feature | Implementation |
|---------|---------------|
| Rate Limiting | express-rate-limit with tiers: 100/15min (public), 20/15min (submissions), 30/15min (admin) |
| Password Hashing | bcrypt with 12 rounds (auto-migrates legacy SHA256 on first login) |
| Session Tokens | 96 random hex bytes, stored as SHA256 hash in DB, 7-day expiry |
| Input Sanitization | HTML tag stripping, character limit enforcement, URL validation, email format validation |
| CSRF Protection | All admin endpoints require Authorization header |
| Password Policies | BCRYPT, no plaintext storage, auto-upgrade on login |
| Database | SQLite file-based, not in git, read/write through prepared statements only |

---

## Deployment

### Prerequisites
- **Frontend**: Any static host (Vercel, Cloudflare Pages, Netlify)
- **Backend**: Node.js host (Railway, Render, Fly.io, VPS)

### Frontend (Vercel)
```
Build command: cd frontend && npm install && npx vite build
Output directory: frontend/dist
Environment: none required (API proxied via Vercel rewrites)
```

### Backend (VPS / Node Host)
1. Clone repo and checkout
2. Set up `backend/.env` with production values
3. Run migration and seed
4. Start: `cd backend && npx tsx src/index.ts`
5. Use PM2 or systemd for process management
6. Set up nginx reverse proxy with SSL

### Environment Variables (Production)
```env
PORT=3001
NODE_ENV=production
GITHUB_TOKEN=your_github_pat
ADMIN_SESSION_SECRET=strong_random_string_here
```

### SSL / Domain
- Set up Cloudflare DNS pointing to your server
- Use certbot for Let's Encrypt SSL
- Configure nginx to proxy `/api/*` to backend and serve frontend static files

---

## File Not in This Repo (But Exists)

- `backend/.env` — Your actual environment file with real secrets (not committed)
- `backend/hermes.db` — The SQLite database file (not committed)
- `node_modules/` — Dependencies (not committed)

---

## License

Private. Not open source. All rights reserved.
