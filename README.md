# dayof

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines React, TanStack Start, Hono, ORPC, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Start** - SSR framework with TanStack Router
- **React Native** - Build mobile apps using React
- **Expo** - Tools for React Native development
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **Hono** - Lightweight, performant server framework
- **oRPC** - End-to-end type-safe APIs with OpenAPI integration
- **Node.js** - Runtime environment
- **Drizzle** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Authentication** - Email & password authentication with Better Auth
- **Husky** - Git hooks for code quality
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
bun install
```

## Database Setup

This project uses PostgreSQL with Drizzle ORM.

1. Make sure you have a PostgreSQL database set up.
2. Update your `apps/server/.env` file with your PostgreSQL connection details.

3. Apply the schema to your database:

```bash
bun db:push
```

Then, run the development server:

```bash
bun dev
```

## Project Structure

```text
dayof/
├── apps/
```

## Available Scripts

- `bun dev`: Start all applications in development mode
- `bun build`: Build all applications
- `bun check-types`: Check TypeScript types across all apps
- `bun db:push`: Push schema changes to database
- `bun db:studio`: Open database studio UI

## Inngest & Events Service

This repo uses Inngest for background jobs and workflows. We centralize Inngest functions in a shared package and expose a single serve endpoint from the `events` app.

### Structure

- `packages/inngest` (published in-workspace as `inngest-kit`)
  - **Client**: shared Inngest client

    ```1:3:packages/inngest/client.ts
    import { Inngest } from 'inngest';

    export const inngest = new Inngest({ id: 'dayof' });
    ```

  - **Functions**: all functions exported in a single array

    ```1:5:packages/inngest/functions/index.ts
    import { exampleEffect } from './exampleEffect';
    import { userSignedIn } from './userSignedIn';
    import { walletPassUpdate } from './wallet-pass-update';

    export const functions = [userSignedIn, exampleEffect, walletPassUpdate];
    ```

  - **Adapter**: mounts the Inngest serve handler for Hono

    ```6:8:packages/inngest/adapters/hono.ts
    export function mountInngest(app: Hono, path = '/api/inngest') {
      app.on(['GET', 'POST', 'PUT'], path, serve({ client: inngest, functions }));
    }
    ```

- `apps/events` (orchestrator service)
  - Hono server that mounts the Inngest endpoint at `/api/inngest` and runs on port 3001 in dev

    ```4:11:apps/events/src/index.ts
    import { mountInngest } from 'inngest-kit/adapters/hono';
    const app = new Hono();
    app.use('*', logger());
    app.get('/', (c) => c.text('OK'));
    mountInngest(app, '/api/inngest');
    ```

  - This is the only app that serves Inngest HTTP; other apps just send events.

### Local development

1. Start the Events service (serves `/api/inngest` on port 3001):

   ```bash
   bun run dev:events
   ```

2. In another terminal, start the Inngest Dev Server (targets the events endpoint):

   ```bash
   bun run dev:inngest:events
   # or
   npx inngest-cli@latest dev -u http://localhost:3001/api/inngest
   ```

3. Open the Dev UI: `http://localhost:8288` → Functions tab → invoke or send events.

The script used by the Dev Server points to the Events app serve URL defined above. You can adjust the `-u` flag if you change ports or paths. See the official Inngest quick start for reference: [Node.js Quick Start](https://www.inngest.com/docs/getting-started/nodejs-quick-start).

### Sending events from other apps

- Server-side: import `inngest` from `inngest-kit` and call `send({ name, data })` in API routes or handlers.
- Browser-side: use `createBrowserInngest(eventKey)` from `inngest-kit/client.browser` when sending directly from the client.

All functions live in `packages/inngest/functions` and are automatically picked up via the exported `functions` array.

### Environment

- Local: no special keys required for the Dev Server.
- Production: set `INNGEST_SIGNING_KEY` in the Events service. If sending from the browser, configure an event key and use `createBrowserInngest(eventKey)` appropriately.

### Why this layout?

- Single serve endpoint reduces duplication and avoids routing conflicts.
- Shared package keeps functions, client, and event contracts centralized and type-safe across apps.
- Matches Inngest guidance for framework adapters and function discovery while fitting a monorepo.
