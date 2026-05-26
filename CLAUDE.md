# CLAUDE.md — KimuX Developer Reference

## Project Status

This project is complete and deployed to production as of May 2026. The platform is live at [https://www.kimux.co](https://www.kimux.co) (frontend) and [https://api.kimux.co](https://api.kimux.co) (backend). It has been handed off to the sponsor (Yannick, contact@kimux.co).

---

## Architecture

- **Frontend:** React 19 / CRA deployed on Vercel
- **Backend:** FastAPI deployed on AWS ECS Fargate (cluster: `kimux-cluster`, service: `kimux-backend`, ECR repo: `kimux-backend`, account `281505305629`)
- **Database:** PostgreSQL on AWS RDS (`kimux-db.cyxecuk22kgr.us-east-1.rds.amazonaws.com`, db: `kimux`, user: `kimux_admin`)
- **ALB:** `kimux-alb` with HTTPS via ACM. Domains: `kimux.co`, `www.kimux.co`, `api.kimux.co`
- **Secrets:** 8 secrets in AWS Secrets Manager under the `kimux/` prefix
- **Current Alembic migration head:** `43c8f9078d11` (12 migrations total)

---

## Tech Stack Constraints

Do not change these without a deliberate architectural decision.

- **Frontend language:** JavaScript only (`.js` files) — no TypeScript, no `.tsx`
- **Styling:** styled-components only — no Tailwind, no CSS modules
- **State management:** React context + hooks only — no Redux, no Zustand, no TanStack Query
- **Backend:** FastAPI + SQLAlchemy 2.0 + Alembic + Pydantic v2
- **AI split:** Gemini 2.5 Flash for **all** AI features **except** funnel HTML generation, which uses Claude Sonnet 4.5 (Anthropic). Do not migrate funnel generation to Gemini. Do not add Claude to any other feature.

---

## Key Architectural Decisions

**Multi-tenancy** — Every CRM query is filtered by `tenant_id`. The `X-Tenant-ID` header is required on all frontend CRM API requests. `SYSTEM_TENANT_ID = "00000000-0000-0000-0000-000000000001"` holds curated offers and contact-form leads — it is not a user tenant.

**Fernet encryption** — Tenant ClickBank credentials are stored encrypted via `KIMUX_FERNET_KEY`. The server refuses to start without this key.

**Reply-to tokens** — HMAC-SHA256 tokens encode `tenant_id:lead_id:comm_id` for inbound email routing. `KIMUX_REPLY_TOKEN_SECRET` is required at startup.

**Funnel HTML is baked at creation time** — `FUNNEL_PUBLIC_BASE_URL` must be set to the backend API URL (e.g. `https://api.kimux.co`) before generating any funnels. Setting the wrong value (e.g. the frontend URL) bakes a broken form `action` into the HTML; fixing it requires regenerating every affected funnel.

**Iframe sandbox** — The funnel preview iframe in `src/pages/crm/CRMFunnelDetail.js` must include `allow-forms` in the `sandbox` attribute. Without it, browsers silently block form submissions inside the iframe with no visible error and no network request.

**Dev proxy** — `src/setupProxy.js` forwards `/api/*` to `127.0.0.1:8000` in local dev. This is intentional — do not change the target.

---

## What Is and Isn't Wired

### Fully wired end-to-end

- **CRM** — Leads, pipeline kanban with drag-and-drop stage persistence, campaigns, communications inbox, analytics dashboards, offer discovery
- **AI** — Gemini lead scoring (0–100, hot/warm/cold), personalized outreach generation, AI reply suggestions; rule-based fallback when API key is absent
- **Funnel Builder** — 6-step wizard → Claude Sonnet 4.5 HTML generation (up to 16 K tokens) → public form submission → CRM lead created with `source="funnel"` and `source_detail` set to the funnel name; static template fallback (minimal/modern/bold) on error or missing key
- **SendGrid** — Outbound email from lead drawer, ECDSA-P256 event webhook (delivered/opened/clicked/bounced → Activity rows + Communication status ladder), inbound parse with HMAC reply-to token routing
- **ClickBank** — Account-scoped API sync using per-tenant credentials stored with Fernet encryption
- **Offer catalog** — Platform-curated offers (ClickBank, BuyGoods, MaxWeb, Digistore24) + user-added offers, Gemini-tagged with traffic-fit and audience tags
- **Multi-tenancy** — Full `tenant_id` scoping on every DB query; async boot sequence resolves tenant before CRM renders

### Scaffolded but not active in production

- Meta/Google/TikTok Ads OAuth — connection cards exist, status is a mock toggle
- Per-tenant SendGrid subuser provisioning — single platform account shared across tenants
- Background job queue — funnel generation uses FastAPI `BackgroundTasks`; Celery/ARQ not implemented
- Public funnel hosting at a custom domain — CloudFront/S3 not configured; funnels are preview-only in-app or downloadable
- Blockchain integration module — `KimuntuX_BlockchainIntegration/` is a Hardhat/Solidity scaffold, not connected to the app
- Google OAuth login — cut from v1 scope

---

## Known Open Issues

**Lead drawer outreach email returns 502/403 from SendGrid** — The From address used in the lead drawer send path differs from the one configured in Settings. The Settings test-send path works correctly. To investigate: `backend/app/services/communication_service.py::send_outreach_email` and the relevant handler in `backend/app/routers/crm.py`. Disclosed to sponsor as a known issue before handoff.

**`reply.kimux.io` MX record not configured** — Inbound email routing only works via direct SendGrid webhook POST to `/api/v1/webhooks/sendgrid/inbound`, not from real email clients replying to a received message.

---

## What Was Cut from V1 Scope

- FB4: funnel edit-via-chat UI
- FB6: funnel polish pass (download, regenerate, inline rename consistency)
- Phase 4: Google OAuth login
- Image generation in funnel hero sections
- Per-tenant SendGrid subuser provisioning and sender domain authentication
- SQLAlchemy `do_orm_execute` guard — service-layer `tenant_id` filtering is enforced; a DB-level guard is future hardening

---

## Setup: One-Time Scripts (DEV only, run in order)

```bash
python backend/admin_setup.py      # provisions the sponsor/admin account — run once
python -m app.scripts.seed         # loads demo leads, campaigns, offers, communications
                                   # DEV ONLY — grants all users demo tenant access;
                                   # do not run in production
```

---

## Required Environment Variables

Full documentation for every variable is in [`backend/.env.example`](backend/.env.example).

### Backend

| Variable | Notes |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | JWT signing secret |
| `KIMUX_FERNET_KEY` | Fernet key for tenant credential encryption. Generate: `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"` |
| `KIMUX_REPLY_TOKEN_SECRET` | HMAC secret for reply-to address tokens. Generate: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `SENDGRID_API_KEY` | Optional in dev; required for outbound email |
| `SENDGRID_EVENT_WEBHOOK_PUBLIC_KEY` | ECDSA-P256 key from SendGrid Mail Settings → Event Webhook. Required if `SENDGRID_API_KEY` is set. |
| `GOOGLE_API_KEY` | Gemini 2.5 Flash. Rule-based fallback activates if absent. |
| `ANTHROPIC_API_KEY` | Claude Sonnet 4.5, funnel generation only. Static template fallback activates if absent. |
| `FUNNEL_PUBLIC_BASE_URL` | **Must be the backend API URL** (e.g. `https://api.kimux.co`), not the frontend. Baked into funnel HTML at generation time. |
| `FUNNEL_FALLBACK_ONLY` | Set `true` to skip Claude and always use static templates. Useful for local dev. |

### Frontend (`.env` at repo root)

| Variable | Dev value | Prod value |
|---|---|---|
| `REACT_APP_API_URL` | *(empty)* | `https://api.kimux.co` |

---

## Coding Conventions

### Frontend

- All components are `.js` — not TypeScript
- styled-components for all styling; create styled components at the top of the file or in a separate `.styles.js` file
- Functional components with hooks; custom hooks live in `src/hooks/`
- State: `useState` / `useEffect` / `useContext` only
- File naming: PascalCase for components (`LeadsTable.js`), camelCase for hooks/services (`useLeads.js`, `api.js`)
- `src/services/api.js` is the centralized fetch wrapper — use it for all API calls; do not bypass it with raw `fetch`

### Backend

Work order for new features: **model → migration → schema → service → router**

- Models go in `backend/app/models/` — import all models in `models/__init__.py`
- Schemas go in `backend/app/schemas/` — Pydantic v2; separate `Create`, `Update`, and `Response` variants
- Business logic goes in `backend/app/services/` — routers call services, services call the database; no business logic in routers
- Use SQLAlchemy 2.0 style queries
- Never use `Base.metadata.create_all()` — always use Alembic for schema changes
- Success response format: `{"data": ..., "message": "..."}` — error format: `{"detail": "..."}`
- **Every CRM service function must filter by `tenant_id`. No exceptions.**

---

## Running Tests

```bash
cd backend
python -m pytest tests/ -v
```

16 test files covering leads, multi-tenancy, ClickBank, offer catalog, SendGrid signature verification, communication service, webhook endpoints, reply tokens, Anthropic client, funnel generation, funnel templates, and public funnel form submission.

The frontend has no test suite beyond the CRA scaffold (`src/App.test.js`).

---

## Deployment: Backend

```bash
# 1. Build image
docker build -t kimux-backend ./backend

# 2. Authenticate and push to ECR
aws ecr get-login-password --region us-east-1 \
  | docker login --username AWS --password-stdin \
    281505305629.dkr.ecr.us-east-1.amazonaws.com

docker tag kimux-backend:latest \
  281505305629.dkr.ecr.us-east-1.amazonaws.com/kimux-backend:latest

docker push \
  281505305629.dkr.ecr.us-east-1.amazonaws.com/kimux-backend:latest

# 3. Force new ECS deployment
aws ecs update-service --cluster kimux-cluster \
  --service kimux-backend --force-new-deployment

# 4. Run migrations (before or as part of the deploy)
alembic upgrade head
```

> `backend/apprunner.yaml` is present in the repo but is no longer used — ECS Fargate replaced App Runner.

---

## Deployment: Frontend

Vercel auto-deploys on push to the connected branch. Set `REACT_APP_API_URL=https://api.kimux.co` in the Vercel dashboard — do not commit this value to a `.env` file.

---

## Files to Read Before Making Changes

| File | Why |
|---|---|
| `src/App.js` | Routing, providers, app shell |
| `src/contexts/UserContext.js` | Auth state — do not break |
| `src/layouts/CRMLayout.js` | CRM sidebar + outlet shell for all CRM pages |
| `src/pages/crm/CRMDashboard.js` | Reference implementation for CRM page patterns |
| `src/hooks/useLeads.js` | Data fetching pattern to follow for new hooks |
| `backend/app/main.py` | FastAPI setup, CORS config, router registration |
| `backend/app/routers/crm.py` | All CRM routes — check here before adding new endpoints |
| `backend/app/services/lead_service.py` | Service layer pattern to follow |
| `backend/tests/conftest.py` | Test setup, session-scoped fixtures, in-memory SQLite |
