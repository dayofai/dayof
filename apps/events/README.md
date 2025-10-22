# Orchestrator service (events.dayof.ai)

Endpoints

- GET / → OK
- GET/POST/PUT /api/inngest → Inngest handler

Local dev

1. pnpm/bun/npm dev at repo root or: bun run dev:events
2. In another terminal: bun run dev:inngest:events

Environment

- INNGEST_SIGNING_KEY (required in prod)
- PORT (optional for local, default 3000)

Deploy

- Vercel Node runtime
- Map domain events.dayof.ai
