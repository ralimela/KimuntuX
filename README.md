# KimuX

**AI-powered affiliate marketing CRM and funnel builder for digital marketers.**

[![Live](https://img.shields.io/badge/Live-kimux.co-00C896?style=flat-square)](https://www.kimux.co)
[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)](https://api.kimux.co)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019-61DAFB?style=flat-square&logo=react)](https://www.kimux.co)

---

## What is KimuX

KimuX is a multi-tenant SaaS platform for affiliate marketers. It combines a full CRM pipeline (leads, campaigns, communications, analytics) with an AI funnel builder that generates complete landing pages, captures form submissions, and routes them directly into the lead pipeline. The platform integrates with ClickBank for account-level offer sync, SendGrid for outbound email and reply tracking, and two AI providers — Gemini for lead intelligence and Claude for funnel HTML generation.

The frontend is a React 19 CRA app deployed at [kimux.co](https://www.kimux.co). The backend is a FastAPI app deployed at [api.kimux.co](https://api.kimux.co) on AWS ECS Fargate, backed by PostgreSQL on AWS RDS. All CRM data is scoped by tenant — each user belongs to a tenant and every database query is filtered by `tenant_id`.

**What is fully wired end-to-end:** CRM (leads, pipeline, campaigns, analytics, offers), AI lead scoring and outreach generation, the funnel builder (wizard → Claude-generated HTML → public form submission → CRM lead), SendGrid outbound email + event webhooks + inbound parse, and ClickBank account sync. **What is scaffolded but not yet active in production:** Meta/Google/TikTok Ads OAuth, per-tenant SendGrid subuser provisioning, background job queue, public funnel hosting at a custom domain, and the blockchain integration module.

---

## Feature Overview

- **CRM** — Leads table with search/filter/sort, pipeline kanban with drag-and-drop stage changes, campaign metrics, split-pane communication inbox, analytics dashboards
- **AI — Gemini 2.5 Flash** — Lead scoring (0–100, hot/warm/cold classification), personalized outreach drafts, AI reply suggestions in the inbox; rule-based fallback when API key is absent
- **AI — Claude Sonnet 4.5** — Single-shot HTML generation for full landing-page funnels (up to 16 K output tokens); static template fallback (minimal / modern / bold) on rate limit, timeout, or missing key
- **Funnel Builder** — 6-step wizard (brand → offer → audience → design → CTA → review) → Claude-generated landing page → public form submission → CRM lead created with `source="funnel"` and `source_detail` set to the funnel name
- **SendGrid** — Outbound email from the lead drawer, ECDSA-P256 event webhook (delivered / opened / clicked / bounced → Activity rows + Communication status ladder), inbound parse with HMAC-SHA256 reply-to token routing
- **ClickBank** — Account-scoped API sync using tenant ClickBank credentials stored with Fernet encryption; per-tenant `IntegrationCredential` rows
- **Offer catalog** — Platform-curated offers (multi-network: ClickBank, BuyGoods, MaxWeb, Digistore24) + user-added offers, each tagged by Gemini with traffic-fit and audience tags
- **Multi-tenancy** — Every CRM query filtered by `tenant_id`; `X-Tenant-ID` header on all frontend API requests; async boot resolves tenant before CRM renders; `SYSTEM_TENANT_ID` holds curated offers and contact-form leads

---

## Architecture

```
kimux.co  (React 19 / CRA / Vercel)
    └── api.kimux.co  (FastAPI / AWS ECS Fargate)
            ├── PostgreSQL  (AWS RDS, us-east-1)
            ├── Gemini 2.5 Flash  (lead scoring, outreach, inbox AI)
            ├── Claude Sonnet 4.5  (funnel generation only)
            ├── SendGrid  (email + event webhook + inbound parse)
            └── ClickBank API  (affiliate account sync)
```

The monorepo has two independent apps: `/src` is the CRA frontend with its own `package.json`, and `/backend` is the FastAPI app with its own `requirements.txt`, `alembic/` migration environment, and `tests/` suite.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Create React App, react-router-dom 6, styled-components, recharts |
| **Backend** | FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2, python-jose, passlib |
| **Database** | PostgreSQL (prod via AWS RDS), SQLite (local dev / tests) |
| **AI** | Gemini 2.5 Flash (lead scoring, outreach, comms), Claude Sonnet 4.5 (funnels only) |
| **Email** | SendGrid (outbound send, event webhook, inbound parse) |
| **Affiliate** | ClickBank API (account-scoped sync), curated offer catalog (multi-network) |
| **Deployment** | AWS ECS Fargate + ECR (backend), Vercel (frontend) |

---

## Local Dev Setup

### Frontend

```bash
npm install
```

Create a `.env` file at the repo root:

```env
REACT_APP_API_URL=        # leave empty — the CRA proxy handles localhost routing
```

```bash
npm start                 # http://localhost:3000
```

### Backend

```bash
cd backend
pip install -r requirements.txt
```

Copy the example env file and fill in values:

```bash
cp .env.example .env
```

Generate the two required secrets (if not already in your `.env`):

```bash
# Fernet key for tenant credential encryption
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# HMAC secret for reply-to address tokens
python -c "import secrets; print(secrets.token_hex(32))"
```

Run migrations and start the server:

```bash
alembic upgrade head
uvicorn app.main:app --reload   # http://localhost:8000
```

**One-time setup scripts (run in order, DEV only):**

```bash
python admin_setup.py           # provisions the sponsor / admin account (run once)
python -m app.scripts.seed      # loads demo leads, campaigns, offers, communications
                                # DO NOT run in production — grants all users demo tenant access
```

---

## Environment Variables

### Frontend (`.env` at repo root)

| Variable | Dev value | Prod value |
|---|---|---|
| `REACT_APP_API_URL` | *(empty)* | `https://api.kimux.co` |

The dev proxy in `src/setupProxy.js` forwards `/api/*` to `127.0.0.1:8000` automatically. Do not change that file.

### Backend (`backend/.env`)

Full documentation of every variable is in [`backend/.env.example`](backend/.env.example). Quick reference:

**Core**

| Variable | Notes |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | JWT signing secret |
| `KIMUX_FERNET_KEY` | Fernet key for tenant credential encryption — server refuses to start without it |
| `KIMUX_REPLY_TOKEN_SECRET` | HMAC-SHA256 secret for reply-to address tokens — required at startup |

**Email**

| Variable | Notes |
|---|---|
| `SENDGRID_API_KEY` | Platform SendGrid account key; optional in dev, required for outbound email |
| `SENDGRID_EVENT_WEBHOOK_PUBLIC_KEY` | ECDSA-P256 key from SendGrid Mail Settings → Event Webhook; required if `SENDGRID_API_KEY` is set |

**AI**

| Variable | Notes |
|---|---|
| `GOOGLE_API_KEY` | Gemini 2.5 Flash; rule-based fallback activates when absent |
| `ANTHROPIC_API_KEY` | Claude Sonnet 4.5, used **only** for funnel HTML generation; static template fallback activates when absent |

**Funnels**

| Variable | Notes |
|---|---|
| `FUNNEL_PUBLIC_BASE_URL` | **Must be the backend API URL** (e.g. `https://api.kimux.co`), not the frontend. This URL is baked into the funnel's generated HTML at creation time. Funnels generated with the wrong value will have a broken form `action` until regenerated. |

---

## Running Tests

```bash
cd backend
python -m pytest tests/ -v
```

The backend suite has 16 test files covering leads, multi-tenancy, ClickBank, offer catalog, SendGrid signature verification, communication service, webhook endpoints, reply tokens, Anthropic client, funnel generation, funnel templates, and public funnel form submission.

The frontend has no test suite beyond the CRA scaffold (`src/App.test.js`).

---

## Deployment Notes

### Backend — AWS ECS Fargate

- Docker image built from `backend/Dockerfile`, pushed to ECR repository **`kimux-backend`** (account `281505305629`)
- ECS cluster: **`kimux-cluster`**, service: **`kimux-backend`**, current task definition revision: **2**
- Load balancer: **`kimux-alb`** with HTTPS via ACM. Domains: `kimux.co`, `www.kimux.co`, `api.kimux.co`
- All backend config is stored in **AWS Secrets Manager** under the `kimux/` prefix (8 secrets). Do not commit `backend/.env` or `backend/kimuntu.db` to version control.

**Before every backend deploy:**

```bash
alembic upgrade head    # current migration head: 43c8f9078d11
```

### Frontend — Vercel

- Deployed automatically on push. Environment variables (`REACT_APP_API_URL=https://api.kimux.co`) are set in the Vercel dashboard — do not put them in a committed `.env`.

### Notes

- `backend/apprunner.yaml` is present in the repo but is **no longer used** — ECS Fargate replaced App Runner.
- `FUNNEL_PUBLIC_BASE_URL` must be correctly set in production **before** generating any funnels. The URL is embedded in the funnel HTML at generation time and cannot be changed without regenerating each funnel.
- `src/setupProxy.js` target (`127.0.0.1:8000`) is dev-only and intentional — do not change it.

---

## Repo Structure

```
/src                               React 19 CRA frontend (pages, components, hooks, services)
/backend                           FastAPI app (models, routers, services, migrations, tests)
/backend/alembic                   12 Alembic migrations — current head: 43c8f9078d11
/backend/tests                     16 integration test files
/backend/app/services/funnel_templates   3 HTML fallback templates (bold, minimal, modern)
/docs                              Handoff docs, Postman collection, sponsor local-setup guide
/public                            Static assets, favicon, manifest, knowledge-base JSON
/KimuntuX_BlockchainIntegration    Hardhat / Solidity scaffold — not active in production
/cypress                           E2E test scaffold (chatbot flow)
```
