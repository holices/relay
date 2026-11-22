# ADR-0006 — Same-origin web ↔ API topology through a proxy

- **Status:** Accepted (plan 000 approved 2026-11-22)
- **Date:** 2026-11-22
- **Phase:** 0
- **Serves:** FR-019, FR-020, FR-027, NFR-002

## Context

The web app (Next.js) and the API (Fastify) are separate processes on different ports, and in production possibly on different hosts. Sessions travel in an `HttpOnly` cookie (ADR-0003). How the browser reaches the API decides how cookies, CORS and CSRF protection work.

## Options

1. **Cross-origin:** the browser calls the API directly, with CORS and credentials.
   - *Pros:* no proxy hop.
   - *Cons:* CORS configuration; in production, cookies must be `SameSite=None` (weakening CSRF defenses) or the API must sit on a sibling subdomain; harder to reason about.
2. **Same-origin via rewrite:** Next.js rewrites `/api/*` to the API, so the browser only ever sees the web origin.
   - *Pros:* first-party cookie with `SameSite=Lax`; no CORS at all.
   - *Cons:* one extra hop through Next.js. SSE streaming (Phase 2) must work through the rewrite.
3. **BFF:** Next.js route handlers or server actions call the API on the user's behalf.
   - *Pros:* full control on the web side.
   - *Cons:* duplicates every endpoint; logic and authorization start leaking into Next.js, against the "UI only" rule.

## Decision

Option 2.
- **CSRF:** in addition to `SameSite=Lax`, the API rejects unsafe methods (POST, PATCH, PUT, DELETE) whose `Origin` header does not equal `WEB_ORIGIN`, answering `403 FORBIDDEN_ORIGIN`.
- **Content type:** JSON bodies require `Content-Type: application/json`, which a cross-site HTML form cannot send.
- **`proxy.ts`:** it only checks that the cookie exists, so it can redirect early. Authorization always happens in the API.

## Consequences

- The API never needs CORS configuration.
- Integration tests must send a valid `Origin` on unsafe requests. A test helper sets it.
- Phase 2 must check that SSE responses stream through the Next.js rewrite without buffering. If they don't, those routes may go direct, on a sibling subdomain, with an amendment to this ADR.

## Revisit when

There is a non-browser API client (CLI, public API), or streaming through the rewrite fails.
