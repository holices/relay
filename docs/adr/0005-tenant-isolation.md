# ADR-0005 — Tenant isolation enforced in the application layer

- **Status:** Accepted (plan 000 approved 2026-11-22)
- **Date:** 2026-11-22
- **Phase:** 0 (revisited in Phase 9)
- **Serves:** FR-024–FR-026, NFR-003

## Context

All business data belongs to an organization. The API must only touch the active organization's data, it must be impossible to write a business operation without specifying the organization (FR-025), and another tenant's resources must look "not found" (FR-026). Product spec §7 makes tenant isolation a mandatory rule. From Phase 2 on, much of the data (conversations, runs, documents) is sensitive.

## Options

1. **Application layer only:** a mandatory `TenantContext` parameter on every business repository function, and every query filters by it.
   - *Pros:* explicit and testable; it surfaces in types; no database magic.
   - *Cons:* one forgotten `WHERE` leaks data. The protection is only as good as the code and its tests.
2. **PostgreSQL Row-Level Security (RLS):** policies on each table, compared against `current_setting('app.organization_id')`, which is set per transaction.
   - *Pros:* the database enforces it, even for buggy queries.
   - *Cons:* every request needs a transaction with `SET LOCAL`; connection pooling becomes delicate; the app's database role must not bypass RLS; harder to debug; migrations become more complex.
3. **Both (defense in depth).** The strongest guarantee. Pays the full cost of RLS up front.

## Decision

Option 1 for now.
- `TenantContext` is a branded type, built only by the auth `preHandler` from the session.
- Business repositories take `ctx` as their first parameter. Without it the code does not compile.
- A mismatched organization ID fails with `NOT_FOUND` before any query runs.
- Integration tests with two organizations try every cross-tenant read and write (AC-19).

## Consequences

- Phase 0 has almost no business data (only the organization itself), so the cost of option 1 is close to zero and the pattern is set before the data grows.
- The guarantee depends on discipline plus tests. Every new module must add cross-tenant tests, and later phase specs will carry that as an NFR.
- RLS stays a planned reinforcement. Phase 9 ("Tenant isolation", product spec §9) evaluates adding it (option 3).

## Revisit when

Phase 9, or earlier if a cross-tenant bug is ever found.
