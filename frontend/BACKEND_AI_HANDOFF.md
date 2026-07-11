# Backend and AI Handoff Brief

Consultin UI is frontend-only. Treat this repository as product interface, design system, and flow prototype. Backend, AI orchestration, billing, storage, and auth services should be implemented in separate services or modules and connected through typed API boundaries.

## Frontend responsibility

This repo owns:

- React/Vite UI screens and route/state prototype.
- Mobile-first adaptation of Figma `UI/UX Canvas - Light`.
- Light/dark theme tokens.
- Static/demo state for onboarding, auth, chat intake, clarification, processing, report, history, account, pricing, and slide deck surfaces.
- UX contract for when backend/AI should be called.
- Documentation for product, design, and flows.

This repo does not own:

- Real authentication.
- User database.
- Payment processing.
- File upload storage.
- Market-data scraping.
- LLM calls.
- Agent orchestration.
- Report generation backend.
- PDF/PPTX export backend.
- Email, notification, analytics, or admin services.

## Required backend modules

### 1. Identity service

Purpose:
- Register/login/logout.
- Password reset.
- Phone/email verification.
- Session refresh.

Suggested API surface:

```http
POST /auth/register
POST /auth/login
POST /auth/logout
POST /auth/refresh
POST /auth/password/forgot
POST /auth/password/reset
POST /auth/verify/send
POST /auth/verify/confirm
GET  /auth/me
```

Frontend needs:
- user profile
- plan/quota
- preferred language
- preferred theme

### 2. Brief intake service

Purpose:
- Accept free-form business prompt.
- Extract structured fields.
- Decide whether details are sufficient.
- Return clarification questions only after submit.

Suggested API surface:

```http
POST /briefs/analyze
POST /briefs/{briefId}/answers
GET  /briefs/{briefId}
```

`POST /briefs/analyze` response shape:

```ts
type BriefAnalysis = {
  briefId: string;
  status: "sufficient" | "needs_clarification";
  extracted: {
    industry?: string;
    location?: string;
    targetCustomer?: string;
    budget?: string;
    goal?: string;
    constraints?: string[];
  };
  missing: string[];
  questions: Array<{
    id: string;
    label: string;
    type: "text" | "select" | "number" | "currency";
    required: boolean;
    options?: string[];
  }>;
};
```

Hard UX rule:
- Frontend must not show parameter chips before submit.
- Backend/AI detects missing info after submit.

### 3. Agent orchestration service

Purpose:
- Run multi-agent analysis after brief is complete.
- Track progress and produce report artifacts.

Suggested API surface:

```http
POST /analysis-runs
GET  /analysis-runs/{runId}
GET  /analysis-runs/{runId}/events
POST /analysis-runs/{runId}/cancel
```

Progress event shape:

```ts
type AnalysisEvent = {
  runId: string;
  step: "intake" | "market_scan" | "competitor_scan" | "financial_model" | "risk_review" | "synthesis" | "done" | "failed";
  label: string;
  status: "queued" | "running" | "done" | "failed";
  message?: string;
  progress?: number;
};
```

Recommended transport:
- Server-Sent Events for progress.
- Polling fallback every 2-5 seconds.

### 4. Research/data service

Purpose:
- Search public web/local market data.
- Normalize sources.
- Store citations.
- Score evidence quality.

Suggested API surface:

```http
POST /research/tasks
GET  /research/tasks/{taskId}
GET  /sources/{sourceId}
```

Minimum source shape:

```ts
type EvidenceSource = {
  id: string;
  title: string;
  url?: string;
  publisher?: string;
  retrievedAt: string;
  confidence: "low" | "medium" | "high";
  summary: string;
};
```

### 5. Report service

Purpose:
- Store generated analysis results.
- Return report content to frontend.
- Generate PDF and slide-deck artifacts.

Suggested API surface:

```http
GET  /reports/{reportId}
GET  /reports/{reportId}/sections
POST /reports/{reportId}/export/pdf
POST /reports/{reportId}/export/deck
GET  /exports/{exportId}
```

Report shape:

```ts
type BusinessReport = {
  id: string;
  briefId: string;
  title: string;
  summary: string;
  scores: Array<{ label: string; value: number; explanation: string }>;
  recommendations: Array<{ title: string; detail: string; priority: "low" | "medium" | "high" }>;
  risks: Array<{ title: string; mitigation: string }>;
  financials?: {
    startupCost?: number;
    monthlyRevenueEstimate?: number;
    breakEvenMonths?: number;
  };
  sources: EvidenceSource[];
  createdAt: string;
};
```

### 6. Billing/quota service

Purpose:
- Track free reports.
- Gate PDF/deck export.
- Manage subscription.

Suggested API surface:

```http
GET  /billing/plan
GET  /billing/quota
POST /billing/checkout
POST /billing/portal
POST /webhooks/payment-provider
```

Frontend needs:
- plan name
- remaining reports
- export entitlement
- billing CTA URL

### 7. File ingestion service

Purpose:
- Upload CSV/PDF/doc/image evidence.
- Extract text/tables.
- Attach files to brief or analysis run.

Suggested API surface:

```http
POST /uploads
GET  /uploads/{fileId}
DELETE /uploads/{fileId}
```

## Frontend integration contract

Recommended module boundary in frontend:

```text
src/app/api/
  auth.ts
  briefs.ts
  analysis.ts
  reports.ts
  billing.ts
  uploads.ts
```

Each file should export typed functions. UI components should not call `fetch` directly.

Example:

```ts
export async function analyzeBrief(input: { message: string; language: "id" | "en" }): Promise<BriefAnalysis> {
  const res = await fetch("/api/briefs/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("BRIEF_ANALYZE_FAILED");
  return res.json();
}
```

## AI team responsibilities

AI/agent team should own:
- prompt templates
- extraction schema
- clarification question generation
- tool-use policy
- citation validation
- hallucination checks
- report synthesis
- language localization quality
- safety/risk guardrails

Frontend only consumes typed outputs.

## Backend team responsibilities

Backend team should own:
- auth/session security
- API routing
- persistence
- queues/workers
- streaming progress
- payment webhooks
- rate limiting
- logging/observability
- secrets management
- file storage

Frontend should never contain API keys or provider credentials.

## Integration milestones

1. Replace mock user/session with `/auth/me`.
2. Replace local brief parsing with `POST /briefs/analyze`.
3. Wire clarification answers to `POST /briefs/{briefId}/answers`.
4. Start analysis through `POST /analysis-runs`.
5. Stream progress from `/analysis-runs/{runId}/events`.
6. Render report from `GET /reports/{reportId}`.
7. Gate export buttons through billing/quota service.
8. Add upload flow for supporting files.

## Non-negotiable UX behaviors

- User starts with free-form chat.
- Clarification appears only after submit and only when needed.
- Long processing uses skeleton/progress states.
- Figma mobile design remains source of truth for UI structure.
- Desktop is scale-up, not a separate product.
