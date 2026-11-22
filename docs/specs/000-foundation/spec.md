# Spec 000 — Foundation

| | |
|---|---|
| **Phase** | 0 — Product & Architecture Foundation |
| **Status** | ✅ Approved (2026-11-22) |
| **Derived from** | Product spec §9 (Phase 0), §3, §5.5, §7, §8, §11, §16 |
| **Next** | [`plan.md`](plan.md) |

> This spec describes **what** and **why**. It does not mention technology. Technical choices (tools, libraries, formats) belong in `plan.md` and in ADRs.

---

## 1. Context and problem

Relay has no code yet. Every later phase (LLM Gateway, Agent Runtime, Tools…) needs the same foundation: an environment anyone can reproduce, an API that validates what it receives and knows who is asking, data kept separate per organization, and an interface where features can appear as they are built.

If this foundation is done badly, the cost shows up later and everywhere. Tenancy bolted on in a hurry leaks data. Unstructured errors make the UI fragile. Logs without a request identifier make debugging impossible. A manual setup means the project stops being demonstrable.

## 2. Goals

1. Anyone can take a clean clone and get Relay running locally, predictably.
2. There is an API with rules shared by every module: input validation, a single error format, request identification and structured logs.
3. A user can sign up, sign in and sign out. Every account belongs to an organization, and data from different organizations never mixes.
4. The application shell exists, with the design system applied, ready to receive the modules of later phases.
5. The first architecture decisions are recorded as ADRs.

### 2.1 Learning goals

By the end of the phase it should be possible to explain, using the code as the example:
- What a monorepo solves and how the task graph between packages is computed.
- Why database changes are versioned (migrations) instead of applied by hand.
- Why validation happens at the system boundary, and how a shared contract prevents client and server from drifting apart.
- The difference between authentication (who you are) and authorization (what you may do), and how a session works.
- How tenant isolation is enforced, and why another tenant's resource answers "not found".
- What structured logs are and what a correlation identifier is for.

Each of these is a candidate for a note in `docs/concepts/`.

## 3. Glossary

| Term | Meaning |
|---|---|
| **Organization** | The system's tenant. The UI calls it a **workspace** (e.g. "Acme Corporation"). They are the same concept: "workspace" in the interface, "organization" in the domain model. |
| **User** | A person with a Relay account. |
| **Membership** | The relation between a user and an organization. |
| **Active organization** | The organization the user is currently working in. Every business operation happens inside it. |
| **Session** | Proof, kept across requests, that the user has authenticated. |
| **Developer** | Whoever develops Relay (for now, the project's author). |

## 4. Actors

- **Developer:** clones, configures, runs, tests and changes the project.
- **Visitor:** a person without a session. They can only sign up or sign in.
- **Member:** an authenticated user who belongs to an organization.

---

## 5. Functional requirements

### 5.1 Development environment

- **FR-001:** From a clean clone, a short, documented set of commands installs the dependencies and starts the local services Relay needs.
- **FR-002:** A single command starts every application in development mode.
- **FR-003:** Single commands at the root check the whole repository: types, style rules and tests. Only what a change affected is run again.
- **FR-004:** The database structure is defined by versioned changes (migrations). There are commands to apply pending migrations and to reset the local database to a clean state.
- **FR-005:** Each application validates its configuration at startup. If a required value is missing or a value is invalid, the application does not start and the message names the value at fault.
- **FR-006:** A versioned configuration example exists, with every required value and no real secrets.

### 5.2 Code organization

- **FR-007:** The code is split into **applications** (what runs) and **shared packages** (what is reused). A package only uses what it declares as a dependency.
- **FR-008:** The definition of each API request and response lives **in one place** and is used by both server and client. An incompatible change makes the check fail on both sides.
- **FR-009:** The API is organized into **modules** with explicit boundaries. A module does not access another module's data directly, only through that module's public interface.

### 5.3 Common API rules

- **FR-010:** The API exposes two health signals. *Liveness* says whether the process is alive and does not depend on external services. *Readiness* says whether it is ready to serve requests and includes database access.
- **FR-011:** Every request is validated against its contract. Requests with missing, invalid or **unknown** fields are rejected before anything happens.
- **FR-012:** Every API error follows the same format. That format includes a stable machine-readable code, a human-readable message, optional details (for example, the invalid fields) and the request identifier.
- **FR-013:** Every request gets a unique identifier. It is returned in the response and appears in every log line related to that request.
- **FR-014:** Logs are structured (named fields, not free text). Passwords, session tokens and other secrets never appear in logs.
- **FR-015:** Unexpected errors do not expose internal details to the client (stack traces, queries). They are logged together with the request identifier.

### 5.4 Accounts, sessions and organizations

- **FR-016:** A visitor can sign up with a **name, email and password** (Q1). The name is shown in the interface and used by FR-017. The email is unique in the system and the password must meet minimum length rules.
- **FR-017:** On sign-up, an **organization** is created for the new user, who becomes its member. Its initial name is derived from the user and can be changed later.
- **FR-018:** A visitor can sign in with email and password. Wrong credentials produce a generic message that **does not reveal whether the email exists**.
- **FR-019:** A valid session identifies the user and the active organization on every following request. A session expires after 7 days without use and is renewed every time it is used (Q5).
- **FR-020:** A member can sign out. The session is invalidated **on the server** and stops working even if someone kept a copy.
- **FR-021:** A member can view their profile and the active organization ("who am I").
- **FR-022:** A member can view and change their organization's name (Settings → General, P0 in product spec §2.11).
- **FR-023:** Requests to protected resources without a valid session are rejected as "unauthenticated".

### 5.5 Isolation between organizations (tenancy)

- **FR-024:** All business data belongs to an organization. The data model allows a user to belong to several organizations, even though this phase's interface shows only one (Q6).
- **FR-025:** The API only reads and writes data of the request's active organization. It must not be possible to write a business operation without specifying the organization.
- **FR-026:** A request that refers to another organization's resource is treated as **"not found"**, never as "forbidden". That way the resource's existence is not revealed.

### 5.6 Interface

- **FR-027:** The interface has sign-up and sign-in pages. Visitors who try to open a protected page are sent to sign-in and, once signed in, return to where they were going.
- **FR-028:** After signing in, the member sees the application **shell**: the sidebar (structure in product spec §2.2) with the workspace name, Home and the account menu, and Home in its empty state. **The sidebar only shows modules that already work.** Each later phase adds its own entry (Q3).
- **FR-029:** Everything that does not belong in the sidebar lives in **Settings**, opened from the account menu, as in the design (product spec §2.2, R7). In this phase, Settings contains only General (FR-022). The account menu also allows signing out (FR-020).
- **FR-030:** The interface applies the "Clean Technical" design system tokens (product spec §2.12: colors, typography, radii, focus states), defined as variables so that dark mode is possible later.
- **FR-031:** No screen shows fake data as if it were real. A section without data shows its empty state.

### 5.7 Documentation

- **FR-032:** The root README explains the prerequisites, setup, how to run, how to check, and where the documentation is.
- **FR-033:** This phase's architecture decisions that have real alternatives are recorded as ADRs in `docs/adr/`.

---

## 6. Non-functional requirements

- **NFR-001 — Reproducibility:** from a clean clone, on a machine with only the documented prerequisites, Relay is running in **≤ 15 minutes** with **≤ 3 commands**, with no undocumented manual steps. Development tool versions are pinned in the repository.
- **NFR-002 — Credential safety:** passwords are never stored in plain text or in a reversible form. A purpose-built password algorithm is used, slow by design. The session credential is not accessible to page scripts.
- **NFR-003 — Isolation proven by tests:** automated tests show that a member of organization A cannot read or change data of organization B.
- **NFR-004 — No secrets in the repository:** no versioned file contains real credentials.
- **NFR-005 — Automatic checking:** the check from FR-003 runs automatically on every push to the remote repository (Q4).
- **NFR-006 — Fast development loop:** in development mode, a code change takes effect without restarting anything by hand.
- **NFR-007 — Accessibility:** this phase's pages follow product spec §2.12: landmarks, labels on every field, visible focus, targets ≥ 34px and form errors tied to their field.
- **NFR-008 — Verifiable boundaries:** the rule in FR-009 is checked automatically. A violation fails the check and does not depend on manual review.

---

## 7. Acceptance criteria

| ID | Covers | Given | When | Then |
|---|---|---|---|---|
| AC-01 | FR-001, FR-002, NFR-001 | a clean clone on a machine with the README prerequisites | the developer runs the documented setup and start commands | the interface and the API are reachable, with the database migrated, and no extra steps |
| AC-02 | FR-003 | a full check already run and no changes since | the check runs again | it finishes without re-running any task |
| AC-03 | FR-003 | a change in a single package | the check runs | only the tasks of that package and of the packages depending on it run again |
| AC-04 | FR-004 | a local database with data | the developer resets it | it is empty and has every migration applied |
| AC-05 | FR-005 | a required configuration value missing | the API starts | it exits with an error and the message names that value |
| AC-06 | FR-008 | an incompatible change in a contract | the check runs | it fails on both the server and the client |
| AC-07 | FR-009, NFR-008 | a module that directly accesses another module's data | the check runs | it fails and identifies the violation |
| AC-08 | FR-010 | the database stopped | the health signals are queried | liveness answers OK and readiness answers "not ready" |
| AC-09 | FR-011, FR-012 | a sign-up request with an unknown field | it is sent | it is rejected in the single error format, naming the field, and nothing is created |
| AC-10 | FR-013 | any request | it is processed | the response carries an identifier, and every log line of that request has the same identifier |
| AC-11 | FR-014 | a sign-in request with a password | it is processed | no log line contains the password or the session token |
| AC-12 | FR-015 | an unexpected error during a request | the API responds | the client gets a generic error with the identifier, and the log has the details |
| AC-13 | FR-016, FR-017 | an email not yet registered | a visitor signs up | a user, an organization and the membership exist, and the visitor is authenticated and sees Home |
| AC-14 | FR-016 | an email already registered | someone tries to sign up with it | the request is refused and no second account is created |
| AC-15 | FR-018 | a wrong password, or an email that does not exist | someone tries to sign in | the message is the same in both cases |
| AC-16 | FR-020 | a member with an active session and a copy of the session credential | they sign out and someone reuses the copy | the API answers "unauthenticated" |
| AC-17 | FR-023, FR-027 | no session | a protected API resource is requested / a protected page is opened | the API answers "unauthenticated" / the page redirects to sign-in and, after signing in, returns to the original destination |
| AC-18 | FR-022 | an authenticated member | they change the organization's name | the new name shows in the sidebar and persists after a page reload |
| AC-19 | FR-025, FR-026, NFR-003 | member A of organization X, and organization Y | A tries to read or change organization Y by its identifier | they get "not found" and Y is unchanged |
| AC-20 | FR-028, FR-029, FR-031 | an authenticated member in a new organization | they open the application | they see the sidebar with the workspace, Home and the account menu (Settings, Sign out), and Home in its empty state, with no fake data and no entries for modules that do not work yet |
| AC-21 | FR-030, NFR-007 | this phase's pages | they are inspected | they use the design system tokens and meet the accessibility rules of NFR-007 |
| AC-22 | NFR-004, FR-006 | the repository | it is inspected | a configuration example exists and no versioned file contains real secrets |

---

## 8. Out of scope

Not part of this phase:
- Any AI feature: providers, agents, conversations, runs (Phase 1+).
- Worker, execution queue, cache, durable workflows and distributed observability (they arrive with the phases that need them).
- Roles and permissions (operate / configure / approve), member invitations and Members & roles (P1).
- Switching organization in the interface (the data model already supports it, see FR-024).
- Password recovery, email verification, social login, SSO (Q2).
- Editable profile, Notifications, Appearance and dark mode.
- Deployment to a public environment.
- Screens for the other modules (Activity, Agents, Workflows…), even as placeholders.

---

## 9. Open questions (Clarify)

All closed.

| # | Question | Decision |
|---|---|---|
| Q1 | Which authentication method in Phase 0? | ✅ Email + password. It is the simplest case that still shows sessions, hashing and non-enumerating errors. Magic link and OAuth come later. |
| Q2 | Are password recovery and email verification in Phase 0? | ✅ No. Both need email delivery, which is new infrastructure. They arrive once there is a notification service. |
| Q3 | Does the sidebar show future modules (disabled) or hide them? | ✅ Hide them. The sidebar only shows what already works, and each phase adds its own entry (same rule as Analytics, product spec R6). Everything outside the sidebar layout lives in Settings, opened from the account menu. See FR-028 and FR-029. |
| Q4 | Is there a remote repository to run the automatic check on (NFR-005)? | ✅ Yes, on GitHub. The concrete setup goes in `plan.md`. |
| Q5 | How long does a session last? | ✅ 7 days, renewed on every use. After 7 days without use it expires. |
| Q6 | Can a user belong to several organizations? | ✅ In the data model, yes. In the Phase 0 interface, no (only the organization created at sign-up). |
| Q7 | Which language does the project use? | ✅ English for everything: interface, code, commits and documentation. The existing docs were translated; `_archive/` stays as it was. |
| Q8 | Which is the main branch: `master` (local) or `main` (configured as main)? | ✅ `main`, renaming the local branch before the first commit. |

---

## 10. Changes after approval

| Date | Change | Why |
|---|---|---|
| 2026-11-22 | FR-016 also asks for a name | Found while planning: FR-017 derives the organization name from the user, and the design's account menu shows the user's name. See plan §17. |

## 11. Verification (Verify)

Filled in at step 6. A criterion is ticked only once it has been demonstrated (with an automated test whenever possible).

- [ ] AC-01 · [ ] AC-02 · [ ] AC-03 · [ ] AC-04 · [ ] AC-05 · [ ] AC-06
- [ ] AC-07 · [ ] AC-08 · [ ] AC-09 · [ ] AC-10 · [ ] AC-11 · [ ] AC-12
- [ ] AC-13 · [ ] AC-14 · [ ] AC-15 · [ ] AC-16 · [ ] AC-17 · [ ] AC-18
- [ ] AC-19 · [ ] AC-20 · [ ] AC-21 · [ ] AC-22

## 12. Retro

*Filled in at the end of the phase: what I learned, what I would change, which notes went to `docs/concepts/`.*
