# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

```bash
# Run all web apps (excludes crew mobile app and docs)
bun dev

# Run specific applications
bun run dev:backstage    # Admin dashboard (port 3001)
bun run dev:frontrow     # Customer-facing web app
bun run dev:events       # Background jobs service
bun run dev:honoken      # Apple Wallet PassKit service
bun run dev:crew         # React Native mobile app
```

### Inngest Background Jobs

To work with background jobs, run both services:

```bash
# Terminal 1: Start events service (port 3001)
bun run dev:events

# Terminal 2: Start Inngest Dev Server
bun run dev:inngest:events
```

Inngest Dev UI: http://localhost:8288

### Database

```bash
# Generate migrations (requires DEV_DATABASE_URL in packages/database/.env)
bun run db:generate

# Apply migrations
bun run db:push

# Open Drizzle Studio GUI
bun run db:studio
```

### Testing

```bash
# Run tests in specific apps (examples from honoken)
cd apps/honoken
bun test              # Run all tests
bun test:smoke        # Run smoke tests
bun test:http         # Run HTTP endpoint tests
bun test:unit         # Run unit tests
bun test:watch        # Watch mode
```

### Type Checking & Linting

```bash
# Check types across all apps
bun run check-types

# Lint with oxlint (configured in root)
bun run check

# Format code (runs on pre-commit via husky)
npx ultracite format
```

## Architecture

### Monorepo Structure

- **Turborepo monorepo** using Bun workspaces
- **Apps:** Deployable applications in `/apps`
  - `auth`: Better Auth service (Hono)
  - `backstage`: Admin dashboard (TanStack Start)
  - `crew`: Mobile app for staff (Expo/React Native)
  - `events`: Inngest background jobs (Hono)
  - `frontrow`: Customer web app (TanStack Start)
  - `honoken`: Apple Wallet PassKit (Hono/Vercel)
- **Packages:** Shared libraries in `/packages`
  - `database`: Drizzle ORM schema, types, and client
  - `inngest-kit`: Inngest client and function definitions

### Key Technologies

- **Frontend:** TanStack Start (React), Expo (React Native)
- **Backend:** Hono framework on Vercel/Edge
- **Database:** PostgreSQL (Neon) with Drizzle ORM
- **Background Jobs:** Inngest for orchestration
- **Auth:** Better Auth for authentication
- **Styling:** TailwindCSS, shadcn/ui, NativeWind
- **API:** oRPC for type-safe APIs

### Database Schema Management

- Schema defined in `packages/database/schema/`
- Single barrel export at `packages/database/schema/index.ts`
- Drizzle Kit uses barrel for migrations - omit experimental modules from barrel to exclude from migrations
- Import paths:
  - `@database/schema`: Full schema with relations
  - `@database`: Re-exports schema barrel

### Testing Strategy

- Each app has its own test configuration
- Hono apps (honoken, events, auth): Vitest with Node environment
- React apps (backstage, frontrow): Vitest with jsdom
- Tests organized in `tests/` directories with `unit/`, `smoke/`, etc.

### Development Workflow

1. Pre-commit hooks run `lint-staged` and `ultracite format`
2. Biome for linting (extends ultracite config)
3. TypeScript for type checking
4. Turbo for build orchestration

### Deployment

- Apps deployed individually to Vercel
- Database on Neon PostgreSQL
- Background jobs via Inngest cloud
