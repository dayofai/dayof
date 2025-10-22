# @dayof/cli-repo — Parity & Hardening Plan

Purpose: Bring the new CLIs to full behavior parity with legacy scripts, remove security risks, and keep scripts simple.

Sources of truth (legacy reference in this repo):

- [packages/cli-utils/cli-repo/old-scripts/neon.ts](packages/cli-utils/cli-repo/old-scripts/neon.ts)
- [packages/cli-utils/cli-repo/old-scripts/neon-branch.ts](packages/cli-utils/cli-repo/old-scripts/neon-branch.ts)
- [packages/cli-utils/cli-repo/old-scripts/vercel.ts](packages/cli-utils/cli-repo/old-scripts/vercel.ts)
- [packages/cli-utils/cli-repo/old-scripts/vercel-env-pull.ts](packages/cli-utils/cli-repo/old-scripts/vercel-env-pull.ts)

Targets to update:

- [packages/cli-utils/cli-repo/src/cli/neon.ts](packages/cli-utils/cli-repo/src/cli/neon.ts)
- [packages/cli-utils/cli-repo/src/cli/vercel.ts](packages/cli-utils/cli-repo/src/cli/vercel.ts)
- [packages/cli-utils/cli-repo/src/config.ts](packages/cli-utils/cli-repo/src/config.ts)
- [packages/cli-utils/cli-repo/src/env.ts](packages/cli-utils/cli-repo/src/env.ts)
- [packages/cli-utils/cli-repo/src/shell.ts](packages/cli-utils/cli-repo/src/shell.ts)

Non-goals:

- No TUI or heavy deps. Keep simple Bun + Node stdlib.
- No behavioral changes to business logic beyond security hardening and bug fixes.

High-level tasks (checklist):

- [x] Neon: Fix parent branch discovery and creation payload
- [x] Neon: Add endpoint create/reuse and readiness polling
- [x] Neon: Reconstruct connection URI using existing DATABASE_URL password
- [x] Neon: Propagate TEMP_BRANCH_DATABASE_URL to all apps and packages/database
- [x] Neon: Delete flow — delete endpoints, branch, clean envs, restore shared DATABASE_URL, clear last-branch when applicable
- [x] Neon: TTL parser parity (s/m/h/d, default 12h)
- [x] Neon: Accept command aliases to match root scripts (create/delete)
- [x] Vercel: Ensure per-app link before env pull
- [x] Vercel: Pull order (source app first), support preview --git-branch
- [x] Vercel: Backfill DATABASE_URL to apps, root, and packages/database when missing and no TEMP
- [x] Vercel: Safe env add via stdin across apps
- [x] Config: Support vercel-projects.json in package with fallback to scripts/
- [x] Imports: Standardize ESM import paths for Bun TS execution
- [x] Smoke verification instructions documented

Details by area

Neon CLI — required changes in [packages/cli-utils/cli-repo/src/cli/neon.ts](packages/cli-utils/cli-repo/src/cli/neon.ts)

1. Parent branch discovery
   - Implement getBranches() => GET /projects/:projectId/branches returning { branches: [...] }
   - Choose parent via default flag, else 'main', else first (see legacy:
     [packages/cli-utils/cli-repo/old-scripts/neon.ts](packages/cli-utils/cli-repo/old-scripts/neon.ts))
2. Branch creation payload
   - POST body: { branch: { name, parent_id, expires_at? } }
   - Attempt with expires_at ISO; on 4xx, retry without expires_at (legacy fallback).
3. Endpoint prepare
   - Find or create read_write endpoint for new branch
   - Wait until endpoint is 'active' or 'idle' with visible progress (2s poll, 120s timeout).
   - Reference legacy: [packages/cli-utils/cli-repo/old-scripts/neon.ts](packages/cli-utils/cli-repo/old-scripts/neon.ts)
4. Connection URI
   - Extract password from existing DATABASE_URL (root .env.local or process.env)
   - Build: postgresql://neondb_owner:${password}@${endpoint.host}/neondb?sslmode=require
   - If password or host missing: hard fail with clear message.
5. Env propagation
   - For each app in vercel-projects.json: write TEMP_BRANCH_DATABASE_URL into apps/<app>/.env.local
   - Also write to packages/database/.env.local
   - Save last branch name to .neon-last-branch (string or JSON with name/id/timestamp is acceptable; keep simple).
6. Delete flow
   - Locate branch by name (or from .neon-last-branch; or current git branch as fallback)
   - Prevent deleting protected branches: main/master/production/prod
   - Delete endpoints for branch, then delete the branch
   - Remove TEMP_BRANCH_DATABASE_URL from all apps and packages/database .env.local
   - Restore shared DATABASE_URL where neither TEMP nor DATABASE_URL exist using source app
   - If deleted branch equals last-branch, remove the file.
7. TTL
   - parseTtl supports s/m/h/d and defaults to 12h; maintain this behavior.
8. Commands
   - Accept both 'branch:create'|'branch:new' and bare 'create' aliases
   - Accept both 'branch:delete' and bare 'delete' aliases

Vercel CLI — required changes in [packages/cli-utils/cli-repo/src/cli/vercel.ts](packages/cli-utils/cli-repo/src/cli/vercel.ts)

1. Link projects before pull
   - Implement linkProject(appDir, projectName) with vercel link --yes --project <name> and scope
   - Skip linking if .vercel/project.json already has projectId/orgId
2. Pull order and flags
   - Pull source app first to seed backfill; then pull others
   - Support preview branch pulls via --git-branch when environment === 'preview'
3. Backfill DATABASE_URL
   - From source app’s env file (.env.local or fileForEnv(env))
   - For each app: if no TEMP_BRANCH_DATABASE_URL and no DATABASE_URL, upsert DATABASE_URL
   - Also ensure root .env.local and packages/database/.env.local have DATABASE_URL when both TEMP and DB are missing
4. Env add
   - Add <key>=<value> across apps via vercel env add <key> development (stdin)
5. Scope handling
   - Keep current team-id caching approach (bunx vercel teams ls --json -> write id)
   - Or accept vercel switch <team> as a fallback doc step in onboard

Shared utilities — current status

- [packages/cli-utils/cli-repo/src/env.ts](packages/cli-utils/cli-repo/src/env.ts): OK; centralizes load/read/upsert/remove/write
- [packages/cli-utils/cli-repo/src/config.ts](packages/cli-utils/cli-repo/src/config.ts): add fallback to scripts/vercel-projects.json (already implemented)
- [packages/cli-utils/cli-repo/src/shell.ts](packages/cli-utils/cli-repo/src/shell.ts): OK; safe argv arrays + stdin helpers
- [packages/cli-utils/cli-repo/src/errors.ts](packages/cli-utils/cli-repo/src/errors.ts): OK; standard error handling

Security guardrails

- Never use shell string concatenation (no bash -c or pipes); always argv arrays
- Use stdin for secrets (NEON_API_KEY, etc.)
- Validate inputs for required flags; fail fast with readable errors

CLI surfaces and root scripts

- Root scripts currently call bare 'create'/'delete' aliases
- Ensure [packages/cli-utils/cli-repo/src/cli/neon.ts](packages/cli-utils/cli-repo/src/cli/neon.ts) accepts those aliases
- Keep root package.json script targets stable

Import path hygiene (Bun TS execution)

- In src, prefer extensionless local imports (../env) or .ts consistently
- Avoid .js extensions in re-exports within src (TS runtime under Bun resolves TS)
- Keep [packages/cli-utils/cli-repo/src/index.ts](packages/cli-utils/cli-repo/src/index.ts) consistent with ESM expectations

Acceptance criteria

- Neon branch:create/new:
  - Creates branch under correct parent; provisions RW endpoint; waits ready
  - Emits valid TEMP_BRANCH_DATABASE_URL and writes it to all apps and packages/database
  - Saves .neon-last-branch
- Neon branch:delete:
  - Deletes endpoints then branch; cleans TEMP from all apps/packages
  - Restores shared DATABASE_URL where missing; removes last-branch if it matches
- Vercel pull:
  - Links each app if needed; pulls envs for source first then others
  - Backfills DATABASE_URL across apps/root/packages when TEMP/DB missing
- Vercel add:
  - Adds key/value to development env across all apps using stdin
- All shell invocations use argv arrays or stdin; no injection-prone strings

Manual verification steps

1. Scope and link
   - bun vercel set-scope <team-slug> (or vercel switch <team>)
   - bun vercel pull (ensure apps get .env.local)
2. Neon ephemeral flow
   - bun neon branch:new feature-xyz 2h
   - Confirm .neon-last-branch created and TEMP_BRANCH_DATABASE_URL written in apps/\*/.env.local and packages/database/.env.local
   - bun neon branch:delete feature-xyz
   - Confirm TEMP removed and DATABASE_URL backfilled where missing
3. Env add
   - bun vercel add TEST_KEY test-value
   - Verify key appears in each project on Vercel and is present after pull

Risks & mitigations

- Neon API payload drift: keep fallback createBranch without expires_at
- Endpoint readiness: log progress every 10s; fail with clear timeout error
- Missing DATABASE_URL password: detect and instruct user to run vercel pull first

Rollout

- Implement Neon first (highest parity gaps), then Vercel
- Validate with manual steps above
- Remove old-scripts directory after parity is verified

Open questions

- Should .neon-last-branch store JSON (name/id/timestamp) or just name? (Legacy used both patterns.)
- Keep team-id cache approach vs. vercel switch? Current approach is safer and non-interactive.

Changelog

- Neon CLI parity implemented:

  - Parent branch discovery (default → main → first)
  - Create payload with expires_at fallback
  - RW endpoint create/reuse + readiness polling
  - Connection URI built from existing DATABASE_URL password
  - TEMP_BRANCH_DATABASE_URL propagated to apps/\* and packages/database
  - Delete flow: endpoints → branch deletion, TEMP cleanup, DATABASE_URL backfill, last-branch file cleanup

- Vercel CLI parity implemented:

  - Non-interactive per-app linking before env pulls
  - Pull source app first, preview --git-branch support
  - DATABASE_URL backfill to apps, root, and packages/database
  - Safe env add via stdin (no shell concat)

- Security hardening:

  - Shell calls use argv arrays or stdin across new CLIs

- Import hygiene:

  - Standardized ESM import paths in src (index exports now extensionless)

- Docs:
  - Updated checklist statuses to reflect completed work
  - **Dead End Alert**: `vercel teams ls --json` doesn't exist in modern Vercel CLI
    - The command was `vercel teams ls` in old scripts but doesn't exist anymore
    - Modern CLI uses `vercel teams list` (not `ls`)
    - The `--json` flag is not documented/supported for teams command
    - **Solution Implemented**:
      - Use `vercel switch <team-slug>` to set team scope
      - Cache the team slug (not ID) in `~/.config/dayof/vercel-scope.txt`
      - Pass `--scope <slug>` flag explicitly to all Vercel commands
      - Removed reliance on VERCEL_ORG_ID and VERCEL_SCOPE environment variables
    - **Why this path works**: The `--scope` flag is the modern, explicit way to target commands at specific teams/orgs
