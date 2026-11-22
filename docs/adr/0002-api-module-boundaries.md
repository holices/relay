# ADR-0002 — API module boundaries and dependency rules

- **Status:** Accepted (plan 000 approved 2026-11-22)
- **Date:** 2026-11-22
- **Phase:** 0
- **Serves:** FR-009, NFR-008

## Context

A modular monolith (ADR-0001) only stays modular if the boundaries are enforced. The spec requires that a module never accesses another module's data directly, and that violations fail the automatic check (NFR-008).

Two questions follow:
- Where does each module's database schema live?
- How is the "one-way, public interface only" rule checked?

Product spec §8 suggests a shared `packages/database` with every schema in it. With a single shared schema, any module can import any table, which is exactly what FR-009 forbids.

## Options

**Where the schema lives**
1. **One shared schema package** (`packages/database`). Simple, and it matches the product spec's suggestion. Any module can query any table, so the boundary is unenforceable.
2. **Each module owns its tables** (`modules/<name>/schema.ts`). Ownership is explicit. Foreign keys across modules need an explicit exception.

**How the rules are enforced**
1. **Convention and code review.** Free, and it silently erodes. It fails NFR-008.
2. **Biome or ESLint import restrictions.** Good for "never import X". Awkward for "only via `index.ts`, except from `schema.ts` to `schema.ts`", and no dependency graph or cycle detection.
3. **dependency-cruiser.** Path-based rules on the real import graph, cycle detection, and readable violation messages. One more dev tool.

## Decision

- **Schema:** option 2.
- **Enforcement:** option 3.
- **Modules:**
  - `platform/`: a shared core (db, errors, tenant context, logger), not a domain module.
  - Domain modules: `health`, `users`, `organizations` and `auth`, with dependencies `auth → organizations → users`.
- **Each module's shape:** `schema.ts`, `repository.ts`, `service.ts`, `routes.ts`, and `index.ts` as the only public entry point.
- **Rules:**
  1. Outside a module, only `index.ts` may be imported.
  2. `schema.ts` → another module's `schema.ts` is allowed **only** for foreign keys.
  3. Modules may import `platform/`. The reverse is forbidden.
  4. The module dependency graph is fixed and acyclic. Adding an edge means changing the rule file, and that change is visible in review.
  5. `packages/*` never import `apps/*`.
- **Cross-module transactions:** services accept an optional `db: Db | Tx`. The use case that needs atomicity opens the transaction and passes it down.

## Consequences

- Splitting `users`, `organizations` and `auth` into three modules looks like overkill for six tables. It exists to make the dependency direction (and the absence of cycles) concrete from the first day.
- Deviates from product spec §8 (`packages/database`). §8 is a suggestion, so the product spec does not need to change.
- The worker in Phase 2 will need these modules. If it becomes a separate app, the modules may have to move to packages. That is decided in Phase 2.
- The FK exception means `schema.ts` files do see each other. Queries still cannot cross modules, because only repositories run queries and only `index.ts` is importable.

## Revisit when

Phase 2 decides where the worker lives, or the number of modules makes the fixed graph a burden.
