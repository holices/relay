# ADR-0001 — Modular monolith with separate processes

- **Status:** Accepted (records product spec §3.1 and §13)
- **Date:** 2026-11-22
- **Phase:** 0

## Context

Relay will have many responsibilities: identity, agents, runs, tools, knowledge, workflows, traces and evaluations. Splitting them into services from day one would mean network calls, distributed transactions, separate deployments and distributed debugging, all before the problems those things solve even exist. Putting everything in one process with no internal structure would make later extraction impossible and let responsibilities bleed into each other.

## Options

1. **Microservices per module.** Independent deployment and scaling. Very high operational cost for one developer, and it hides the AI Engineering concepts behind infrastructure.
2. **Unstructured monolith.** Fastest start. Boundaries erode quickly, and there is no path to extraction.
3. **Modular monolith, plus separate processes where the workload differs.** One codebase and one database, with internal modules that have explicit boundaries. Long-running work (agent runs, Phase 2) runs in separate worker processes, not inside HTTP requests.

## Decision

Option 3. In Phase 0 there is only the API process and the web app. A worker process arrives in Phase 2. Whether it lives in a separate `apps/worker` or is a second entrypoint of `apps/api` will be decided in Phase 2's plan.

## Consequences

- Boundaries must be enforced by tooling, not by deployment (see ADR-0002).
- A module can be extracted later because it already talks to others only through a public interface.
- A single database keeps transactions simple. Cross-module transactions are explicit (ADR-0002).

## Revisit when

A module has clearly different scaling, availability or security needs (for example, sandboxed tool execution).
