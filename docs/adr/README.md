# Architecture Decision Records

One ADR per decision that had real alternatives. ADRs are never edited after being accepted, except to change their status. A change of mind gets a new ADR that supersedes the old one.

**Format:** Context → Options → Decision → Consequences → Revisit when.

| # | Title | Status | Phase |
|---|---|---|---|
| [0001](0001-modular-monolith.md) | Modular monolith with separate processes | Accepted | 0 |
| [0002](0002-api-module-boundaries.md) | API module boundaries and dependency rules | Accepted | 0 |
| [0003](0003-authentication-own-sessions.md) | Authentication with in-house server-side sessions | Accepted | 0 |
| [0004](0004-internal-packages-and-typescript-execution.md) | Source-only internal packages and native TypeScript execution | Accepted | 0 |
| [0005](0005-tenant-isolation.md) | Tenant isolation enforced in the application layer | Accepted | 0 |
| [0006](0006-web-api-topology.md) | Same-origin web ↔ API topology through a proxy | Accepted | 0 |

"Proposed" becomes "Accepted" when the phase plan that references the ADR is approved.
