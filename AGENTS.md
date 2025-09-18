# Repository Guidelines

## Project Structure & Module Organization

DayOf is a Bun + Turborepo monorepo. Deployable apps live in `apps/` (frontrow web, backstage admin, events Inngest jobs, honoken PassKit). Shared libraries and tooling live in `packages/`, including `database` for Drizzle schema and `cli-utils` for platform scripts. Tests sit beside code or under `tests/` (e.g. `apps/honoken/tests/smoke`).

## Build, Test, and Development Commands

Run `bun install` once, then `bun dev` to launch all web services except `crew` and `handbook`. Use targeted scripts like `bun run dev:backstage`, `bun run dev:frontrow`, or `bun run dev:events` when debugging a single app. `bun run build` compiles every workspace, while `bun run check` (oxlint) and `bun run check-types` guard lint and type health. Background workers require a second terminal: `bun run dev:events` plus `bun run dev:inngest:events`. Database workflows rely on `bun run db:generate`, `db:push`, and `db:studio`.

## Coding Style & Naming Conventions

Biome (extending Ultracite) and Oxlint enforce formatting; pre-commit hooks run `lint-staged` followed by `npx ultracite format`. Keep 2-space indentation, single quotes in TypeScript, and trailing commas where Biome inserts them. Prefer `camelCase` for functions and files inside modules, `PascalCase` for React components, and `kebab-case` directories. Import from workspace aliases (`@database/...`, `@inngest/...`) instead of relative traversals.

## Testing Guidelines

Vitest is the default test runner. Each app owns its config; for example, `apps/honoken` exposes `bun test`, `bun test:unit`, and `bun test:smoke`. Co-locate new suites under `tests/unit` or `tests/smoke` and name files `*.test.ts` or `*.test.tsx`. Ensure smoke tests cover critical pass issuance and event flows before shipping. Run `bun run check-types` after test updates to catch broken contracts.

## Commit & Pull Request Guidelines

Follow the existing history: short, imperative subjects (e.g. “Fix cache headers”) without Conventional Commit prefixes. Reference relevant issues inline and mention any database migrations or env changes. Before opening a PR, run build, check, and the affected app’s tests; attach screenshots or recordings for UI tweaks. PR descriptions should summarize scope, list manual checks, and flag rollout or onboarding follow-ups.

## Environment & Security Notes

Onboarding scripts live in `packages/cli-utils`; new machines should run `bun onboard` to fetch env files and verify CLIs. Store sensitive keys in `.env` files kept out of version control and use `bun env:pull` for Vercel sync. For feature branches, prefer ephemeral Neon branches via `bun db:branch:new` and clean them up with `bun db:branch:delete` during PR closure.

## CRITICAL: Use ripgrep, not grep

NEVER use grep for project-wide searches (slow, ignores .gitignore). ALWAYS use rg.

- `rg "pattern"` — search content
- `rg --files | rg "name"` — find files
- `rg -t python "def"` — language filters

## File finding

- Prefer `fd` (or `fdfind` on Debian/Ubuntu). Respects .gitignore.

## JSON

- Use `jq` for parsing and transformations.

## Agent Instructions

- Replace commands: grep→rg, find→rg --files/fd, ls -R→rg --files, cat|grep→rg pattern file
- Cap reads at 250 lines; prefer `rg -n -A 3 -B 3` for context
- Use `jq` for JSON instead of regex
