# Tasks 000 — Foundation

| | |
|---|---|
| **Spec / Plan** | [`spec.md`](spec.md) · [`plan.md`](plan.md) (both approved 2026-11-22) |
| **Status** | ✅ Approved (2026-11-22) · in progress |

## Conventions

- Tasks run **in order**. A task starts only when the previous one is done, unless it is marked *(parallel with Txxx)*.
- **One task = one commit** (or a few, if the task is large). Commits follow [Conventional Commits](https://www.conventionalcommits.org/) and end with the task ID: `feat(api): add request id hook (T013)`.
- **"Done when"** is the gate. A task is not done until every item there is true. Tick the box here in the same commit.
- **Breaking a gate:** if a task shows that the plan or the spec is wrong, stop. Fix the document first, then continue (see `docs/README.md`).
- `Refs` point to spec requirements, acceptance criteria, plan sections and ADRs.

---

## M0 — Repository hygiene

### [x] T001 · First commit on `main`
- **Refs:** Q8, NFR-004
- **Steps:**
  - Rename the local branch `master` → `main`.
  - Add a root `.gitignore`: `node_modules`, `.env`, `.env.*` (except `.env.example`), `.turbo`, `.next`, `coverage`, `playwright-report`, `test-results`, `*:Zone.Identifier`.
  - Delete the `*:Zone.Identifier` files in `docs/_archive/`.
  - Commit `docs/`.
- **Done when:** `git log` shows one commit on `main`, and `git status` is clean.

---

## M1 — Monorepo skeleton and spike (plan §15, R1–R2)

### [ ] T002 · Root workspace
- **Refs:** FR-001, FR-003, FR-007, plan §2, §12
- **Steps:**
  - **Root `package.json`:** `private`, `packageManager: pnpm@12.x`, `engines.node: ">=24 <25"`, and scripts `dev`, `check`, `bootstrap`, `db:*`, `test:e2e` (placeholders are fine for now).
  - **`.nvmrc`:** `24`.
  - **`pnpm-workspace.yaml`:** `apps/*`, `packages/*`, plus a `catalog` with typescript, zod, vitest, @biomejs/biome and the `@types/*` packages.
  - **`turbo.json`:** `transit` (`dependsOn: ["^transit"]`); `typecheck`, `lint` and `test` (`dependsOn: ["transit"]`, explicit `inputs`); `build` (`dependsOn: ["^build"]`, `outputs: [".next/**", "!.next/cache/**"]`); `dev` (`persistent`, `cache: false`).
  - **`biome.json`:** formatter + linter with `noFloatingPromises` on.
- **Done when:** `pnpm install` succeeds, and `pnpm turbo run typecheck` runs without errors (zero tasks is fine).

### [ ] T003 · `packages/tsconfig`
- **Refs:** ADR-0004, plan §2
- **Steps:**
  - **`base.json`:** `strict`, `noUncheckedIndexedAccess`, `erasableSyntaxOnly`, `verbatimModuleSyntax`, `allowImportingTsExtensions`, `rewriteRelativeImportExtensions`, `module`/`moduleResolution: nodenext`, `target: es2024`, `noEmit`.
  - **`node.json`:** extends base, `types: ["node"]`.
  - **`next.json`:** extends base, with `jsx: preserve`, `module: esnext`, `moduleResolution: bundler`, `lib: dom` and the `next` plugin.
- **Done when:** the package exists with `exports` for the three files. It is consumed in T004–T006.

### [ ] T004 · `packages/contracts` skeleton
- **Refs:** FR-008, plan §6
- **Steps:**
  - `package.json` with `exports: { ".": "./src/index.ts" }`, depending only on `zod`.
  - `src/health/` with `HealthResponse`, plus one unit test.
  - Per-package `typecheck` (`tsc`), `lint` (`biome check .`) and `test` (`vitest run`) scripts.
- **Done when:** `pnpm check` runs typecheck, lint and test for `contracts`, and all pass.

### [ ] T005 · `apps/api` minimal
- **Refs:** FR-010 (partial), ADR-0004
- **Steps:**
  - Fastify 5 with `src/app.ts` exporting `buildApp()` and `src/server.ts` calling `listen`.
  - `GET /health/live`, typed with `HealthResponse` from `@relay/contracts`.
  - `dev` script: `node --watch src/server.ts`.
- **Done when:** `pnpm --filter api dev` serves `curl localhost:3001/health/live` → `{"status":"ok"}`; editing the handler reloads automatically (NFR-006); `typecheck` and `lint` pass.

### [ ] T006 · `apps/web` minimal *(parallel with T005)*
- **Refs:** ADR-0004, plan §11
- **Steps:**
  - Next.js 16 App Router, TypeScript and `transpilePackages: ["@relay/contracts"]`.
  - One page that parses a sample object with a contract schema and renders the result.
- **Done when:** `pnpm --filter web dev` renders the page, and both `next build` and `typecheck` pass.

### [ ] T007 · Spike verdict and cache check
- **Refs:** plan §15 R1–R2, ADR-0004, AC-02, AC-03
- **Steps:**
  - Confirm, or apply the fallbacks: TypeScript 6.0.x if TS 7 breaks `next build`; `tsx` if type stripping fails for a workspace package.
  - Run `pnpm check` twice. Change one file in `contracts` and run it again.
- **Done when:**
  - The ADR-0004 status line records "spike confirmed" or the fallback that was applied.
  - The second `pnpm check` reports every task cached.
  - After the `contracts` change, only `contracts`, `api` and `web` tasks re-run, and the `--summarize` output is noted for Verify.

---

## M2 — Local infrastructure and database

### [ ] T008 · Docker Compose
- **Refs:** FR-001, plan §12
- **Steps:**
  - `docker-compose.yml`: a `postgres` service with `pgvector/pgvector:pg18`, a healthcheck (`pg_isready`), a named volume and port `${POSTGRES_PORT:-5432}`.
  - `infrastructure/docker/postgres/init.sql` creates `relay_test`.
- **Done when:** `docker compose up -d --wait` reports healthy, and `psql` lists both `relay` and `relay_test`.

### [ ] T009 · API configuration
- **Refs:** FR-005, FR-006, NFR-004, AC-05, plan §10
- **Steps:**
  - `src/env.ts` holds the Zod schema for the variables in plan §10.
  - A parse failure prints each failing variable and exits with code 1.
  - `apps/api/.env.example`.
  - Scripts use `node --env-file-if-exists=.env`.
- **Done when:** a unit test covers the valid case and a missing `DATABASE_URL`. A process test that spawns the server without it sees exit code 1 and a message naming `DATABASE_URL` (AC-05).

### [ ] T010 · Database access and migrations tooling
- **Refs:** FR-004, AC-04, plan §5
- **Steps:**
  - `platform/db.ts`: a `pg` pool, the Drizzle instance and the `Db` and `Tx` types.
  - `drizzle.config.ts` with schema glob `src/modules/*/schema.ts` and output `drizzle/`.
  - `scripts/migrate.ts`: the programmatic migrator.
  - `scripts/reset.ts`: drops and recreates the `public` schema, then migrates. It refuses unless the host is `localhost` or `127.0.0.1`.
  - Root scripts `db:generate`, `db:migrate` and `db:reset`.
- **Done when:** with no schema yet, `db:migrate` runs cleanly; `db:reset` against a non-local URL exits with an error.

### [ ] T011 · Bootstrap
- **Refs:** FR-001, NFR-001, AC-01
- **Steps:** `scripts/bootstrap.ts` copies each `.env.example` to `.env` when `.env` is missing, then runs `docker compose up -d --wait`, then `db:migrate`. It is idempotent.
- **Done when:** in a fresh clone in a temp directory, `pnpm install && pnpm bootstrap && pnpm dev` brings up web and API. Running `pnpm bootstrap` a second time changes nothing.

---

## M3 — API platform

### [ ] T012 · Integration test harness
- **Refs:** plan §13
- **Steps:**
  - `apps/api/vitest.config.ts` with `unit` and `integration` projects; integration uses `fileParallelism: false`.
  - A `globalSetup` migrates `relay_test`.
  - Helpers:
    - `resetDb()`: `TRUNCATE` all tables.
    - `buildTestApp(opts)`: injectable pool, log capture and test-only routes.
    - `request()`: wraps `inject` and sets a valid `Origin` on unsafe methods.
- **Done when:** one integration test (`/health/live`) runs green inside `pnpm check`.

### [ ] T013 · Request IDs and logging
- **Refs:** FR-013, FR-014, AC-10, plan §9
- **Steps:**
  - `genReqId` with `randomUUID`.
  - An `onSend` hook sets `x-request-id`.
  - `platform/logger.ts` holds the Pino options: redaction paths, `LOG_LEVEL`, and `pino-pretty` when `LOG_PRETTY=true`.
- **Done when:** an integration test checks that the response header equals the `reqId` of every captured log line for that request (AC-10).

### [ ] T014 · Error format and validation
- **Refs:** FR-011, FR-012, FR-015, AC-09, AC-12, plan §6
- **Steps:**
  - `contracts/common`: the `ErrorResponse` schema and the `ErrorCode` union.
  - `platform/errors.ts`: the `AppError` base class and its subclasses, a `setErrorHandler` (Zod type-provider errors → `VALIDATION_FAILED` with `details`; `AppError` → its own code; anything else → logged plus `INTERNAL`), and a `setNotFoundHandler`.
  - Wire `fastify-type-provider-zod`.
- **Done when:** integration tests, using test-only routes, show:
  - An unknown body field → `400 VALIDATION_FAILED`, with the field in `details`.
  - A thrown `Error` → `500 INTERNAL`, a generic message, the `requestId`, and the stack only in the log (AC-12).
  - An unknown route → `404 NOT_FOUND` in the same format.

### [ ] T015 · Health
- **Refs:** FR-010, AC-08
- **Steps:**
  - The `health` module: `live` (static) and `ready` (`SELECT 1`, 1 s timeout).
  - Register `ready` only after T010, since it needs the database.
- **Done when:** integration tests show `ready` returns 200 with the database up, and `live` 200 with `ready` 503 `NOT_READY` when the pool points at a closed port (AC-08).

### [ ] T016 · Origin check
- **Refs:** ADR-0006
- **Steps:** `platform/origin-check.ts` is an `onRequest` hook for POST, PUT, PATCH and DELETE that compares `Origin` with `WEB_ORIGIN`.
- **Done when:** integration tests show a missing or foreign `Origin` → `403 FORBIDDEN_ORIGIN`, and the correct `Origin` passes.

### [ ] T017 · Module boundary enforcement
- **Refs:** FR-009, NFR-008, AC-07, ADR-0002
- **Steps:**
  - `apps/api/.dependency-cruiser.cjs` holds the five rules from plan §4.2 and forbids cycles.
  - The api `lint` script runs `biome check . && depcruise src`.
- **Done when:** `pnpm check` passes. A temporary import from `modules/organizations/repository.ts` into `modules/auth/` fails lint with a message naming the rule. Record the output for Verify, then revert (AC-07).

---

## M4 — Users, organizations and auth

### [ ] T018 · `platform/tenant-context.ts`
- **Refs:** FR-025, ADR-0005, plan §8
- **Steps:** a branded `TenantContext` type and a `createTenantContext()` function exported for the auth module only (enforced by a dependency-cruiser rule).
- **Done when:** a type test (`expectTypeOf` / `// @ts-expect-error`) shows that a plain object is not assignable to `TenantContext`.

### [ ] T019 · `users` module
- **Refs:** FR-016, plan §5
- **Steps:**
  - `schema.ts` (`users`), `repository.ts`, `service.ts` (`createUser`, `findByEmail`, `findById`; emails are trimmed and lowercased) and `index.ts`.
  - Generate and review the migration.
- **Done when:** integration tests show that email normalization works and that a duplicate email violates the unique constraint. The migration SQL is committed.

### [ ] T020 · `organizations` module
- **Refs:** FR-017, FR-022, FR-024–FR-026, plan §5, §8
- **Steps:**
  - `schema.ts` (`organizations` and `memberships`, with an FK to `users`), the repository, and the service: `createWithOwner(db, {ownerId, name})`, `getForTenant(ctx, id)`, `renameForTenant(ctx, id, name)`.
  - An ID that differs from `ctx.organizationId` → `NotFoundError` before any query.
  - Generate the migration.
- **Done when:** integration tests cover creation with an owner, renaming within the tenant, and cross-tenant get and rename → `NotFoundError` with the row unchanged.

### [ ] T021 · Password handling
- **Refs:** FR-016, FR-018, NFR-002, ADR-0003, plan §7
- **Steps:**
  - `auth/password.ts`: the 15–128 character policy, an argon2id `hash` and `verify` with OWASP parameters in one constant, and a precomputed dummy hash for unknown emails.
- **Done when:** unit tests cover the policy edges (14, 15, 128 and 129 characters), hash → verify true, wrong password → false, and that the stored hash starts with `$argon2id$`.

### [ ] T022 · Sessions
- **Refs:** FR-019, FR-020, FR-023, ADR-0003, plan §7
- **Steps:**
  - `auth/schema.ts`: `password_credentials` and `sessions`, with their migration.
  - `auth/sessions.ts`: token generation (32 bytes, base64url), the SHA-256 ID, and `create`, `validateAndRenew` and `revoke`.
  - Cookie helpers.
  - `auth/plugin.ts`: a `requireSession` preHandler that sets `request.ctx` or throws `UNAUTHENTICATED`.
- **Done when:** integration tests show:
  - A valid token → a context is set and `expires_at` moves forward.
  - An expired session → 401 and the row is deleted.
  - A revoked session → 401.
  - The database holds the hash, never the raw token.

### [ ] T023 · Auth, me and organization contracts
- **Refs:** FR-008, FR-011, plan §6
- **Steps:** in `packages/contracts`, using `z.strictObject` everywhere and sharing the password policy constants with T021:
  - `auth/`: `SignUpRequest` and `SignInRequest`.
  - `me/`: `Me`.
  - `organizations/`: `Organization`, `OrganizationParams` and `RenameOrganizationRequest`.
- **Done when:** unit tests cover valid and invalid examples, including unknown keys.

### [ ] T024 · Auth routes
- **Refs:** FR-016–FR-021, FR-023, AC-09, AC-13–AC-17, plan §6–7
- **Steps:**
  - `POST /v1/auth/sign-up`: one transaction for user, credential, organization, membership and session.
  - `POST /v1/auth/sign-in`: dummy-hash path for unknown emails.
  - `POST /v1/auth/sign-out`.
  - `GET /v1/me`.
- **Done when:** integration tests pass for:
  - **AC-09:** unknown field on sign-up → 400, and no rows are created.
  - **AC-13:** sign-up creates 1 user, 1 org named "{first name}'s workspace" and 1 membership, sets the cookie, and `/v1/me` returns them.
  - **AC-14:** a duplicate email → 409 `EMAIL_TAKEN`, and the user count is unchanged.
  - **AC-15:** a wrong password and an unknown email return byte-identical error bodies, apart from `requestId`.
  - **AC-16:** after sign-out, reusing the old cookie → 401.
  - **AC-17 (API):** no cookie → 401 on `/v1/me`.

### [ ] T025 · Organization routes
- **Refs:** FR-022, FR-025, FR-026, AC-18 (API), AC-19, NFR-003
- **Steps:** `GET` and `PATCH /v1/organizations/:organizationId`.
- **Done when:** integration tests with two signed-up users (A in X, B in Y) pass for:
  - A renames X, and the new name is persisted.
  - A's GET and PATCH on Y both return `404 NOT_FOUND`, and Y's name is unchanged (AC-19).

### [ ] T026 · No secrets in logs
- **Refs:** FR-014, AC-11
- **Steps:** with log capture on, run sign-up, sign-in, an authenticated request and sign-out.
- **Done when:** a test asserts that no captured line contains the password, the raw token or the cookie value (AC-11).

---

## M5 — Web

### [ ] T027 · Design tokens and base components
- **Refs:** FR-030, NFR-007, product spec §2.12
- **Steps:**
  - Tailwind v4 `@theme` with every §2.12 token as a CSS variable (colors, states, radii, `shadow-xs`).
  - Geist and Geist Mono via `next/font`.
  - The focus ring.
  - Run `shadcn init`, add Button, Input, Label and DropdownMenu, and restyle them to the tokens: button variants Primary, Secondary, Positive and Destructive; input error state.
- **Done when:** a dev-only `/_design` page (excluded from production) shows each component in each state and matches Foundations visually.

### [ ] T028 · API client and data layer
- **Refs:** FR-008, ADR-0006, plan §10–11
- **Steps:**
  - `next.config.ts` rewrites `/api/:path*` to `${API_URL}/:path*`.
  - `src/env.ts` for the web app and `apps/web/.env.example`.
  - `lib/api.ts`: a typed `fetch` wrapper that parses success bodies and `ErrorResponse` with the contracts, and throws `ApiError {code, details, requestId}`.
  - A TanStack Query provider.
- **Done when:** with the API running, the minimal page from T006 shows `/api/health/live` through the rewrite. A unit test covers how `lib/api.ts` parses an error body.

### [ ] T029 · Sign-up and sign-in pages
- **Refs:** FR-016, FR-018, FR-027, NFR-007
- **Steps:**
  - `(auth)/sign-up` and `(auth)/sign-in` with React Hook Form and the contract schemas.
  - API `details` are mapped back to their fields with `aria-describedby`.
  - The generic credentials error is shown as a form-level message.
  - After success, go to a validated `next` (starts with `/` and not `//`), otherwise to `/`.
- **Done when:** both flows work by hand against the API, and a unit test covers the `next` validator (`/settings` ok; `//evil.com` and `https://evil.com` rejected).

### [ ] T030 · Session gate
- **Refs:** FR-023, FR-027, AC-17 (web)
- **Steps:**
  - `proxy.ts` redirects `(app)` routes without the cookie to `/sign-in?next=…`.
  - The `(app)` layout queries `/v1/me` and redirects on 401.
- **Done when:** opening `/settings/general` signed out → sign-in → after signing in, lands on `/settings/general`.

### [ ] T031 · Application shell and Home
- **Refs:** FR-028, FR-029, FR-031, NFR-007, AC-20
- **Steps:**
  - **Sidebar:** 248px, `sidebar` background, workspace name, Home (`aria-current`), and `nav` with `aria-label`.
  - **Account menu:** name, initials, Settings and Sign out (which calls the API and returns to `/sign-in`).
  - **Home:** the "Your AI workspace" header and an empty state with no actions that lead nowhere.
  - `main` landmark.
- **Done when:** a manual check against `Sidebar.dc.html` and `Main.dc.html` shows no entries for unbuilt modules and no sample data.

### [ ] T032 · Settings and General
- **Refs:** FR-022, FR-029, AC-18
- **Steps:**
  - `/settings`: a grouped list with only "General" (icon, title, description, current value and chevron), as in `WorkspaceSettings.dc.html`.
  - `/settings/general`: a name field with validation and save. On success, invalidate the `me` query so the sidebar updates.
- **Done when:** a rename shows in the sidebar immediately and survives a reload.

### [ ] T033 · End-to-end and accessibility tests
- **Refs:** AC-13, AC-17, AC-18, AC-20, AC-21, NFR-007
- **Steps:**
  - Playwright config with Chromium; `webServer` starts the API and web against `relay_test`.
  - Specs:
    1. Sign-up → Home (AC-13, AC-20).
    2. Signed-out deep link → sign-in → back (AC-17).
    3. Rename → sidebar → reload (AC-18).
    4. Sign-out → protected page redirects.
    5. axe scan of sign-in, sign-up, Home, Settings and General with zero violations (AC-21).
  - Root `pnpm test:e2e`.
- **Done when:** `pnpm test:e2e` passes locally.

---

## M6 — CI, documentation and closing

### [ ] T034 · CI workflow
- **Refs:** NFR-005, plan §14
- **Steps:** `.github/workflows/ci.yml` as described in plan §14, with a `check` job and an `e2e` job.
- **Prerequisite:** a GitHub repository exists and `origin` points to it. Creating it and pushing are done by the developer, or with their explicit OK.
- **Done when:** a push to `main` produces a green run, and a deliberately failing test on a branch produces a red one.

### [ ] T035 · Root README
- **Refs:** FR-032, NFR-001
- **Steps:** a `README.md` covering what Relay is (one paragraph), prerequisites with versions, the three commands, ports, `pnpm check`, `pnpm test:e2e`, the `db:*` scripts, troubleshooting (port conflicts) and links to `docs/`.
- **Done when:** someone following only the README on a clean clone gets the app running (rehearsed in T036).

### [ ] T036 · Verify
- **Refs:** spec §11, all ACs
- **Steps:**
  - Walk through AC-01 to AC-22.
  - For each criterion, tick the box in `spec.md` §11 and add the evidence: test name, command output or timing.
  - AC-01: time a fresh clone on a clean machine or container and record the time (≤ 15 min).
- **Done when:** every box is ticked with evidence. A criterion that cannot be met goes back to the spec or the plan, not into a silent waiver.

### [ ] T037 · Retro and concept notes
- **Refs:** spec §2.1, §12
- **Steps:**
  - Fill in `spec.md` §12.
  - Write `docs/concepts/` notes for the learning goals that turned out to be the least obvious (at least: sessions, tenant isolation, the monorepo task graph).
  - Update `docs/README.md` to mark Phase 0 done.
- **Done when:** the retro is written, at least three concept notes exist, and the phase status says ✅.
