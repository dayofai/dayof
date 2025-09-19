# dayof

A full-stack monorepo for "DayOf", an event management platform. Built with a modern TypeScript stack including React (TanStack Start), React Native (Expo), Hono, Drizzle, and Inngest.

## Core Technologies

- **Frameworks**: TanStack Start (React), Expo (React Native), Hono
- **UI**: TailwindCSS, shadcn/ui, NativeWind
- **API**: oRPC, Better Auth
- **Database**: PostgreSQL with Drizzle ORM (Neon)
- **Background Jobs**: Inngest
- **Tooling**: Turborepo, Bun, TypeScript, Biome, Ultracite

---

## Project Structure

This repository is a monorepo managed by Turborepo, organized into `apps` and `packages`.

### Apps

The `apps` directory contains the individual, deployable applications of the platform.

| Application | Description                                                       | Framework      |
| ----------- | ----------------------------------------------------------------- | -------------- |
| `auth`      | Authentication service using Better Auth.                         | Hono           |
| `backstage` | Admin web dashboard for managing events and operations.           | TanStack Start |
| `crew`      | React Native mobile application for event staff.                  | Expo           |
| `events`    | Central service for handling and serving Inngest background jobs. | Hono           |
| `frontrow`  | Customer-facing web application.                                  | TanStack Start |
| `handbook`  | Internal documentation site.                                      | Fumadocs       |
| `honoken`   | Apple Wallet PassKit web service for digital tickets.             | Hono           |

### Packages

The `packages` directory contains shared libraries and configurations used across the applications.

| Package       | Description                                                                |
| ------------- | -------------------------------------------------------------------------- |
| `cli-utils`   | CLI utilities for managing Neon databases and Vercel deployments.          |
| `database`    | Shared Drizzle schema, client, and types for the Neon PostgreSQL database. |
| `inngest-kit` | Shared Inngest client, functions, and event definitions.                   |

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.0 or higher)
- Access to a Neon PostgreSQL database
- Vercel account and [Vercel CLI](https://vercel.com/cli) for local development and deployment
- NEON_API_KEY environment variable for database branch management

### 1. Installation

Install all dependencies from the root of the monorepo:

```bash
bun install
```

### 2. Initial Setup

> **🚀 Quick Start for New Developers**
>
> After installing dependencies, run the onboarding script to automatically configure your entire development environment:
>
> ```bash
> bun onboard
> ```
>
> This single command handles all the setup complexity for you!

The onboarding script will:

- **Check required tools**: Verify Bun and Git are installed
- **Check optional tools**: Detect GitHub CLI, Vercel CLI, and Neon CLI availability
- **Verify authentication**: Check if you're logged into GitHub and Vercel (if CLIs are installed)
- **Install dependencies**: Run `bun install` to set up all packages
- **Pull environment variables**: If authenticated with Vercel, automatically run `vercel pull` to fetch environment variables

**Prerequisites**:

- **Required**: Bun and Git must be installed
- **Recommended**: Install Vercel CLI (`bun add -g vercel`) and authenticate (`vercel login`) for automatic environment setup
- **Optional**: GitHub CLI and Neon CLI for additional DevOps capabilities

**Note**: The script provides clear guidance if any tools are missing. If Vercel CLI isn't installed or you're not authenticated, you'll need to manually set up environment variables.

### 3. Environment Management

The CLI utilities provide powerful environment and database management:

```bash
# Pull latest environment variables from Vercel
bun env:pull

# Create a temporary database branch for feature development
bun db:branch:new feature-xyz 2h

# Delete a database branch when done
bun db:branch:delete feature-xyz

# Add an environment variable across all apps
bun vercel add KEY value
```

---

## Development

### Running Applications

You can run all applications simultaneously or individually. Dev ports:

- events: [http://localhost:3000](http://localhost:3000)
- auth: [http://localhost:3001](http://localhost:3001)
- honoken: [http://localhost:3002](http://localhost:3002)
- backstage: [http://localhost:3003](http://localhost:3003)
- frontrow: [http://localhost:3004](http://localhost:3004)

```bash
# Run all web apps and services in development mode
bun dev

# Run a specific application (e.g., backstage)
bun run dev:backstage

# Available app-specific dev scripts:
# bun run dev:events
# bun run dev:backstage
# bun run dev:frontrow
# bun run dev:handbook
# bun run dev:crew
# bun run dev:honoken
```

### Inngest & Events Service

This repo uses Inngest for background jobs, orchestrated through the `apps/events` service.

1. **Start the Events service** (serves `/api/inngest` on port 3000):

   ```bash
   bun run dev:events
   ```

2. In a **separate terminal**, start the Inngest Dev Server, pointing to the events service:

   ```bash
   bun run dev:inngest:events
   ```

3. Open the Inngest Dev UI at `http://localhost:8288` to monitor and trigger functions.

Refer to the [Inngest & Events Service](#inngest--events-service) section in the main `README.md` for more details on the architecture.

---

## Database Management

The database schema is centrally managed in the `packages/database` workspace using Drizzle ORM.

### Core Database Commands

```bash
# Generate migrations after schema changes
bun run db:generate

# Apply migrations to your database
bun run db:push

# Open Drizzle Studio GUI
bun run db:studio
```

### Ephemeral Database Branches

The CLI utilities support creating temporary database branches for feature development:

```bash
# Create a branch with TTL (supports s/m/h/d suffixes, defaults to 12h)
bun db:branch:new feature-xyz 2h

# Delete a branch when done
bun db:branch:delete feature-xyz

# Or use the full command syntax
bun neon branch:create feature-xyz 2h
bun neon branch:delete feature-xyz
```

When you create a branch:

- A new Neon branch is created from the parent (default/main)
- A read-write endpoint is provisioned and waits until ready
- The branch's database role password is reset to an ephemeral value via Neon API
- `TEMP_BRANCH_DATABASE_URL` is written to all app `.env.local` files
- The branch name is saved to `.neon-last-branch` for easy cleanup

When you delete a branch:

- All endpoints for the branch are deleted
- The branch itself is removed
- `TEMP_BRANCH_DATABASE_URL` is cleaned from all `.env.local` files
- `DATABASE_URL` is restored where needed

### Schema Organization

- **Single entrypoint for schema**: We expose the schema through a barrel file at `packages/database/schema/index.ts`. The package root also re-exports that barrel via `packages/database/index.ts`.
  - Import surfaces:
    - `@database/schema`: full schema barrel, including the composed `schema` object and `relations`.
    - `@database`: re-exports the same barrel for a flatter import path.
- **Drizzle Kit config uses the barrel**: `packages/database/drizzle.config.ts` sets `schema: './schema/index.ts'`, so only what the barrel exports is considered when generating and pushing migrations.
- **Omitting experimental modules**: To exclude a table/module (e.g., payments) from generation and push, do not export it from `packages/database/schema/index.ts`. Because Drizzle Kit reads only from the barrel, omitted modules will not be included in migrations.

---

## CLI Utilities

The `packages/cli-utils` package provides DevOps automation:

### Quick Commands

```bash
# Onboarding & Setup
bun onboard                    # Complete developer onboarding wizard
                               # - Checks prerequisites (Bun, Git, Vercel CLI, etc.)
                               # - Installs dependencies
                               # - Pulls env vars if Vercel CLI is authenticated

# Database Branch Management
bun db:branch:new              # Create ephemeral database branch (requires NEON_API_KEY)
bun db:branch:delete           # Delete database branch (requires NEON_API_KEY)

# Environment Management
bun env:pull                   # Pull all Vercel env vars to local .env files
                               # (requires Vercel CLI authentication)
bun env:add KEY=value          # Add env var to all Vercel projects
                               # (requires Vercel CLI authentication)
```

### Vercel Integration

```bash
# Set team scope (run once)
bun vercel set-scope <team-slug>

# Pull environment variables from all Vercel projects
bun vercel pull

# Add an environment variable to all projects
bun vercel add KEY value
```

The Vercel CLI utility:

- Automatically links projects before pulling environments
- Pulls from the source project first, then others
- Backfills `DATABASE_URL` across all apps when needed
- Supports preview environment pulls with `--git-branch`
- Uses secure stdin for sensitive values

### Neon Database Management

```bash
# Create ephemeral branch
bun neon create <branch-name> [ttl]

# Delete branch
bun neon delete <branch-name>

# Or use the db: prefixed commands
bun db:branch:new <branch-name> [ttl]
bun db:branch:delete <branch-name>
```

The Neon CLI utility:

- Creates branches with parent discovery (default → main → first)
- Provisions read-write endpoints with readiness polling
- Resets branch-local role password via Neon API and builds the connection URI with it (shared `DATABASE_URL` is untouched)
- Propagates temporary database URLs to all apps
- Protects main/production branches from deletion
- Supports TTL with s/m/h/d suffixes (default: 12h)

### Manual Setup (Without Vercel CLI)

If you run `bun onboard` without Vercel CLI installed, you'll need to manually:

1. **Install Vercel CLI** (optional but recommended):

   ```bash
   bun add -g vercel
   vercel login
   ```

2. **Link projects and pull environment variables**:

   ```bash
   vercel link  # In each app directory
   vercel pull  # Pull env vars for linked project
   ```

3. **Or manually create `.env` files**:
   - Create `.env.local` in the root directory
   - Create `packages/database/.env.local` with your `DATABASE_URL`
   - Add any other required environment variables

### Security Features

All CLI utilities implement security best practices:

- Shell commands use argv arrays (no string concatenation)
- Sensitive values passed via stdin (never in command line)
- Input validation with clear error messages
- Protected branch safeguards
