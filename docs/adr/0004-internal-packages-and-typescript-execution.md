# ADR-0004 — Source-only internal packages and native TypeScript execution

- **Status:** Accepted (plan 000 approved 2026-11-22) · spike confirmed 2026-11-22 (T007): TypeScript 7.0.2 `tsc` and `next build` work; Node 24 type stripping runs the API and the `@relay/contracts` workspace package from source. No fallback needed.
- **Date:** 2026-11-22
- **Phase:** 0
- **Serves:** FR-003, FR-007, NFR-006

## Context

The monorepo shares code between apps (`packages/contracts` now; more packages in later phases). Two linked questions:
1. **Internal packages:** are they compiled before use, or consumed as TypeScript source?
2. **Running the API:** how is its TypeScript executed in development and in production?

Node 24 can run TypeScript directly by stripping types. That works only for "erasable" syntax: no `enum`, no `namespace`, no constructor parameter properties.

## Options

**Internal packages**
1. **Compiled:** each package has a build step that produces JS and `.d.ts`. Fast, standalone consumers. But every change means a rebuild, plus watch processes, plus stale-output bugs.
2. **TypeScript project references:** `tsc -b` builds the graph incrementally. Correct and precise, but heavy configuration, and it must be kept in sync with `package.json` dependencies.
3. **Just-in-Time (source only):** `exports` points at `src/*.ts`, and each consumer's toolchain compiles it. No build step and instant changes. Every consumer must be able to compile TS, and the cache hashes need the `transit` task (plan §12).

**Running the API**
1. **`tsx`:** mature, handles any TS syntax. One more dependency, and it differs slightly from production.
2. **Bundle with `tsdown`:** a single optimized output for production. Adds a build step, and the deployed code differs from the source.
3. **Node native type stripping:** `node --watch src/server.ts` in development and `node src/server.ts` in production. Nothing to add. Requires erasable syntax and explicit `.ts` extensions on relative imports.

## Decision

- **Internal packages:** option 3 (JIT).
  - Next.js compiles them via `transpilePackages`.
  - The API runs them through Node's type stripping. Workspace packages are symlinks that resolve to `packages/…`, not to `node_modules`, so type stripping applies to them.
  - Vitest compiles them natively.
- **Running the API:** option 3 (native type stripping), with no build step.
  - The base tsconfig enables `erasableSyntaxOnly`, `verbatimModuleSyntax`, `allowImportingTsExtensions` and `rewriteRelativeImportExtensions`.
  - `tsc --noEmit` only type-checks; it never emits.

## Consequences

- There is no `build` task for packages or the API. Only `apps/web` has one (`next build`).
- Contributors cannot use enums or namespaces. Use `as const` objects and modules instead.
- Turborepo cache correctness depends on the `transit` pattern (plan §12).
- Risks R1 and R2 (plan §15) are checked by a spike in the first task. **Fallback:** `tsx` for the API, and TypeScript 6.0.x if TypeScript 7 breaks a tool. Either fallback is recorded here as an amendment to the status.

## Revisit when

A package must be published outside the monorepo, startup time in production matters, or a dependency requires non-erasable syntax.
