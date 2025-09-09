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
| `database`    | Shared Drizzle schema, client, and types for the Neon PostgreSQL database. |
| `inngest-kit` | Shared Inngest client, functions, and event definitions.                   |

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.0 or higher)
- Access to a Neon PostgreSQL database.
- Vercel account and [Vercel CLI](https://vercel.com/cli) for local development and deployment.

### 1. Installation

Install all dependencies from the root of the monorepo:

```bash
bun install
```

### 2. Environment Setup

Each application in the `apps/` directory may require its own `.env` file for local development. Copy the corresponding `.env.example` file (if it exists) to `.env` and fill in the required environment variables, such as database connection strings and API keys.

---

## Development

### Running Applications

You can run all applications simultaneously or individually.

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

1.  **Start the Events service** (serves `/api/inngest` on port 3001):
    ```bash
    bun run dev:events
    ```
2.  In a **separate terminal**, start the Inngest Dev Server, pointing to the events service:
    ```bash
    bun run dev:inngest:events
    ```
3.  Open the Inngest Dev UI at `http://localhost:8288` to monitor and trigger functions.

Refer to the [Inngest & Events Service](#inngest--events-service) section in the main `README.md` for more details on the architecture.

---

## Database Management

The database schema is centrally managed in the `packages/database` workspace using Drizzle ORM.

- **Generate Migrations**: After making changes to the schema in `packages/database/schema/`, run the generate command from the root. This requires a `DEV_DATABASE_URL` variable in `packages/database/.env`.
  ```bash
  bun run db:generate
  ```
- **Apply Migrations**: Apply generated migrations to your database.
  ```bash
  bun run db:push
  ```
- **Drizzle Studio**: To open a local GUI for the database, run:
  ```bash
  bun run db:studio
  ```

_Note: The `db:_`scripts in the root`package.json`are configured to run these commands within the`packages/database` workspace.\*
