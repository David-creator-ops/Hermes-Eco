# HERMES AGENT REGISTRY - COMPLETE SPECIFICATION (A TO Z)

## PROJECT OVERVIEW

### What We're Building
A **web-based marketplace and discovery platform** for AI agents and tools built on top of the **Hermes Agent framework**. It showcases community-built agents, enables easy discovery, auto-verifies legitimacy, and provides proof that projects are genuinely Hermes-based.

### Why
- Hermes is a powerful open-source agent framework, but **no central place exists** for the community to discover agents built with it
- Developers building Hermes agents have no way to **showcase their work**
- Users don't know **what's possible** with Hermes
- No **quality control** — anyone could claim to be "Hermes-based" without actually using it
- We need a **single source of truth** for Hermes ecosystem

### Core Vision
**"Like npm for Hermes agents — but curated, verified, and beautiful."**

---

## SECTION A: PRODUCT REQUIREMENTS

### A1. Primary Features

#### Feature 1: Agent Discovery & Search
- **What:** Browse, search, and filter all Hermes agents/tools in one place
- **User Sees:**
  - Clean searchable directory of agents
  - Filter by: agent type, tools used, tags, verification status, stars
  - Sort by: most recent, most popular, best verified

#### Feature 2: Verification & Trust Badges
- **What:** Automatic verification that agents are actually built with Hermes
- **User Sees:**
  - 🟢 **"Verified Built with Hermes ✨"** (7-8 checks passed)
  - 🟡 **"Community Listed"** (4-6 checks passed)
  - ❌ **Rejected** (spam/not Hermes)

#### Feature 3: Simple Agent Submission
- **What:** Builders add ONE file to their repo → auto-listed
- **User (Builder) Does:**
  1. Creates `.hermes-registry.json` in their repo root
  2. Fills in metadata
  3. Commits & pushes
  4. Our crawler finds it automatically within 24 hours

#### Feature 4: Agent Detail Pages
- **What:** Full information page for each agent

#### Feature 5: Categories & Collections
- **What:** Organize agents by use case

#### Feature 6: Stats & Analytics Dashboard
- **What:** Show ecosystem health

#### Feature 7: Builder Profile Pages
- **What:** Showcase author's agents & reputation

---

## SECTION B: TECHNICAL ARCHITECTURE

### B1. Tech Stack
- Frontend: React 19 + TypeScript + Vite + shadcn/ui + Tailwind
- Backend: Node.js + Express
- Database: PostgreSQL
- Crawler: GitHub Actions cron job

### B2. Data Flow
1. Builder adds `.hermes-registry.json`.
2. Crawler finds file and verifies repository.
3. Database is updated.
4. Website reflects changes.

---

## SECTION C: IMPLEMENTATION PHASES
- Phase 1: MVP (Homepage, Browse, Discovery, Crawler)
- Phase 2: Verification (8-point system)
- Phase 3: Polish (SEO, Mobile, UI transition)
- Phase 4: Community (Leaderboard, Discord Integration)
