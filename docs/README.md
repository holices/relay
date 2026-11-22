# Relay — Documentation

This project follows **Spec-Driven Development (SDD)**. The goal is to **learn AI Engineering**, not to ship fast. The specs are the implementation plan and also the record of what was learned and why.

**Language:** everything in the project (interface, code, commits and documentation) is written in English. The originals in `_archive/` are kept as they were.

## Map

| Folder | Contents | Changes when… |
|---|---|---|
| `product/relay-product-spec.md` | Vision, scope, target architecture, phases | The product changes direction |
| `design/canvas/` | "Clean Technical" design canvas (visual reference) | The design is revised |
| `specs/NNN-name/` | One spec per phase or feature (spec → plan → tasks) | We start a new phase |
| `adr/NNNN-title.md` | Architecture Decision Records | We make a decision with real alternatives |
| `concepts/` | Learning notes (e.g. "what an agent loop is") | We learn a relevant concept |
| `_archive/` | Originals (Workforce spec, design zip) | Never |

## Order of authority

```text
product spec  >  phase spec  >  plan  >  tasks  >  code
```

A lower level never contradicts a higher one. If the implementation shows that a spec was wrong, **the spec is fixed first**, and only then the code. That way the documentation never goes stale silently.

## The cycle of a phase spec

Each phase in the product spec (section 9) goes through these steps, **one at a time, with a review between them**:

| # | Step | Artifact | Question it answers | Gate |
|---|---|---|---|---|
| 1 | **Specify** | `spec.md` | *What* and *why*? Which problem, which behavior, how do we know it is right? | Requirements and acceptance criteria approved |
| 2 | **Clarify** | "Open questions" section of `spec.md` | What is still ambiguous? | All blocking questions resolved |
| 3 | **Plan** | `plan.md` (+ ADRs) | *How*? Architecture, contracts, data, trade-offs, risks | Plan approved; ADRs written |
| 4 | **Tasks** | `tasks.md` | In what order? Which small, verifiable steps? | Every task has a "done" criterion |
| 5 | **Implement** | code + tests | — | Tests pass |
| 6 | **Verify** | checklist in `spec.md` | Does it meet every acceptance criterion? | All verified |
| 7 | **Retro** | `concepts/` + notes in the spec | What did I learn? What would I change? | — |

### Rules

- **`spec.md` does not mention technology.** It says "the API validates the request and rejects unknown fields", not "use Zod". The *how* belongs in `plan.md`. This split forces thinking about the problem before the solution.
- **Requirements have IDs** (`FR-001` functional, `NFR-001` non-functional) so that tasks, tests and ADRs can reference them.
- **Acceptance criteria are testable**, preferably in *Given / When / Then* form.
- **Out of scope is explicit.** A list of what is *not* being done prevents scope creep.
- **Mark uncertainty:** `[NEEDS CLARIFICATION: …]` instead of inventing an answer.
- **ADR when there are real alternatives.** If the choice is obvious, one line in `plan.md` is enough.

## Phase status

| Phase | Spec | Status |
|---|---|---|
| 0 — Foundation | `specs/000-foundation/` | 🛠️ Implementing (see `tasks.md`) |
| 1 — LLM Gateway | — | — |
| 2 — Agent Runtime | — | — |
| 3 — Tools & Integrations | — | — |
| 4 — Memory | — | — |
| 5 — Knowledge & RAG | — | — |
| 6 — Workflows | — | — |
| 7 — Observability | — | — |
| 8 — Evaluations | — | — |
| 9 — Security & Optimization | — | — |
