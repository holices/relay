# ADR-0003 — Authentication with in-house server-side sessions

- **Status:** Accepted (plan 000 approved 2026-11-22)
- **Date:** 2026-11-22
- **Phase:** 0
- **Serves:** FR-016–FR-023, NFR-002

## Context

Phase 0 needs email + password sign-up, sign-in and sign-out (Q1). Sign-out must invalidate the session on the server (FR-020). A session lasts 7 days without use and is renewed on use (Q5). One of the phase's learning goals is to understand how a session actually works. OAuth, SSO, password recovery and email verification are out of scope (Q2).

## Options

1. **In-house:** argon2id password hashes, opaque random session tokens, and a `sessions` table that stores only the token's hash.
   - *Pros:* full understanding and control; tiny surface (4 endpoints); fits the data model and tenancy exactly (the session carries the active organization); no external service.
   - *Cons:* security is our responsibility; features such as OAuth, MFA and password reset all have to be built later or migrated.
2. **Auth library (e.g. Better Auth).**
   - *Pros:* battle-tested flows; plugins for organizations, OAuth and MFA.
   - *Cons:* owns part of the schema and of the request flow; hides exactly what this phase wants to teach; its organization model would compete with ours.
3. **Hosted provider (e.g. Clerk).**
   - *Pros:* least code; enterprise features (SSO, MFA) ready.
   - *Cons:* external dependency and account; user data lives outside our database; its tenancy model shapes ours; offline development is harder; and it teaches nothing about sessions.

## Decision

Option 1, following the OWASP Password Storage and Session Management cheat sheets:
- argon2id (m = 19 MiB, t = 2, p = 1).
- Passwords of 15–128 characters, no composition rules (NIST SP 800-63B rev. 4).
- A 32-byte random token, stored as `SHA-256(token)`.
- Cookie: `HttpOnly`, `SameSite=Lax`, and `Secure` in production.
- Sliding expiry of 7 days.
- Constant-time sign-in failures (a dummy hash is verified when the email does not exist).
- Credentials kept in their own table, apart from `users`.

Details are in plan §7.

## Consequences

- Every security property is covered by an integration test (AC-11, AC-14–AC-17).
- Session renewal costs one database write per authenticated request (plan §15, R5).
- Adding OAuth or MFA later means more credential types in `auth`, or migrating to a library. Separate credential storage keeps either path open.
- CSRF protection depends on the topology (ADR-0006).

## Revisit when

OAuth, SSO or MFA enters scope, or a security review finds the in-house approach is costing more than it teaches.
