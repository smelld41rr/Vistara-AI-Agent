# Vistara AI — project rules

Source: user-supplied master build specification, read in full together with the 11-page PDF.

## 4. HONESTY AND REPORTING RULES (highest priority, override everything else)
1. Never fake progress, results, screenshots, test outcomes or completion.
2. Never claim a test passed unless you executed it and saw it pass. Record the exact command and result summary in docs/TEST_REPORT.md.
3. Give every capability one of these status labels in docs/PROGRESS.md: DONE_VERIFIED, DONE_UNVERIFIED, PENDING, BLOCKED (with the reason). Generated code alone is never DONE_VERIFIED.
4. Distinguish clearly: unit tests, mock-browser tests, real-extension tests in Chrome, live-website checks, and tests blocked by the environment. Never present a fixture screenshot as a real Chrome screenshot.
5. If an environment restriction blocks a step (for example, cannot load an unpacked extension because of administrator policy), document the blocker, provide a manual verification checklist, and continue only with independent work. Never bypass the policy and never mark the blocked item as complete.
6. Never claim the extension can perform an action that is not implemented and tested. Document honest limits in docs/KNOWN_LIMITATIONS.md.


## 5. WORKING PROCESS
1. Inspect the working directory first. If a project exists, read it, preserve unrelated files and avoid overwriting work. If empty, create a new project.
2. Research current official documentation for WXT, Chrome extension APIs (sidePanel, storage, scripting, alarms, tabs, permissions), @google/genai (models listing, generateContent, function calling, structured output) and the Groq API. Record verified versions and API patterns in docs/DECISIONS.md.
3. Write docs/ARCHITECTURE.md, docs/ROADMAP.md and docs/TEST_PLAN.md before heavy coding. Document the reasoning before any major architectural change.
4. Work milestone by milestone (Section 18). Finish and verify one milestone before starting the next. Do not build everything as one untested block.
5. Maintain these living files at all times: docs/PROGRESS.md (status of every capability and milestone, next unfinished item), docs/DECISIONS.md (context, choice, alternatives, consequences), CHANGELOG.md, docs/TEST_REPORT.md. After each milestone, update them and create a git commit locally (never push).
6. If your context is reset or you resume later, read AGENTS.md, docs/PROGRESS.md and docs/DECISIONS.md first and continue from the first unfinished item. Create AGENTS.md at the start from Sections 4, 5, 6, 8, 9 and 15 of this specification so future sessions inherit the rules.
7. Definition of done for every tool or feature: Zod schema, implementation, unit test, fixture-site test, documentation entry, honest status label.
8. STOP AND ASK the user before: adding or widening a manifest permission, adding a dependency larger than 200 KB or needing a paid service, changing the approval/risk policy, changing the provider interface, deleting existing user files, or doing anything outside this specification.
9. Do not deploy, publish to the Chrome Web Store, or push to any remote repository without explicit approval. Do not expose secrets. Do not push source code or ZIPs to GitHub.
10. Do not stop at planning. Implement working code and progress as far as the environment and verification allow.


## 6. ENGINEERING RULES
- Real implementation, not placeholder UI. Every visible button must work or be removed; unbuilt screens show an honest "Not built yet" state.
- Keep browser automation provider-independent. Keep user credentials out of content scripts.
- Validate every AI-generated tool call. Bounded timeouts and retry limits everywhere.
- Handle Manifest V3 service-worker lifecycle: it can be suspended at any time.
- Do not load remotely hosted executable code. No hidden telemetry.
- Clean module boundaries, typed contracts between modules, no giant files with unrelated code. Reusable components are independent.
- Preserve existing functionality during UI changes (regression tests).
- Optimize AI token use and avoid unbounded DOM scanning.


## 8. API KEY MANAGEMENT (Bring Your Own Key)
- Never embed a shared developer key. Keys must never appear in source, Git history, logs, exports, URLs, content scripts or any page context.
- Default storage: chrome.storage.session (ephemeral, cleared when the browser closes), with access restricted to trusted extension contexts (setAccessLevel). Optional local persistence only after an explicit disclosure that browser-local secrets are not equivalent to a server-side vault.
- Keys are used only from the background service worker. Content scripts and the page never receive them.
- UI: add, replace, remove, test connection, current provider, current model, connection status, quota-error guidance.
- Redact keys in every error, log, trace and export path, and unit-test the redaction (including keys embedded in URLs and error objects).
- Document in docs/SECURITY.md the limits of a client-side BYOK model for any future public distribution, and describe an optional secured-backend design as a non-mandatory future option. Do not build that backend.


## 9. CLOUD AI PRIVACY
Before any page content is sent to Gemini or Groq:
- Tell the user in the UI that content is processed by an external provider and is not local. Disclose that free-tier prompts may be used by the provider to improve its products, according to the provider's current terms, and link the provider's terms page.
- Require one-time per-provider consent plus a per-conversation current-page-context toggle that is OFF by default.
- Minimize what is sent: relevant sections only, visible readable text, concise structured snapshots. Never auto-include unrelated tabs.
- Redact known sensitive fields (passwords, tokens, OTPs, card numbers, hidden inputs) before transmission. Never claim cloud processing is local or fully private.
- Local data stays local by default. No synchronization, no hidden telemetry, no collection of browsing history unrelated to the requested task. Provide deletion controls.


## 15. SECURITY
This is a high-trust extension. Security is not optional and is enforced in deterministic application code, never only in prompts.

### 15.1 Action risk classification
LOW: reading public page text, scrolling, opening a public link, extracting non-sensitive information.
MEDIUM: editing a non-sensitive form, changing site settings, navigating to a user-specified domain.
HIGH: submitting forms, sending messages or emails, posting publicly, deleting data, purchases, confirming bookings, changing security settings, financial transactions, uploading potentially sensitive files.
HIGH actions always require fresh, explicit user approval in the UI that shows the exact action, target element, site and data involved. Never execute them silently, and never from a scheduled run without fresh approval. Classification uses element role, text, form context and target URL in code (for example a submit button inside a form, or labels such as buy, pay, send, delete, confirm).
Never autonomously enter credentials, payment details, OTPs or highly sensitive personal data. Refuse and ask the user to do it manually.

### 15.2 Prompt-injection defense
Treat all webpage text, comments, ads, extracted data and tool results as untrusted input. Page content must never be able to: change system instructions, override permission checks, trigger tools without authorization, cause external data transmission, request secrets, or disable safety controls. Measures: delimit untrusted content in prompts and state that it is data; strip or neutralize instruction-like patterns in reports to the user; validate every tool call against the user's original goal scope and the permitted sites; block navigation or data export to domains not approved for the task; require approval for any action that deviates from the user's stated goal. Keep a regression suite of injection pages (Section 19).

### 15.3 Data handling
Local-first storage with deletion controls. Redact credentials and sensitive content in logs and exports. Do not inject external executable scripts. Never bypass website security features. Do not implement CAPTCHA bypass, anti-bot evasion, credential harvesting or bulk extraction of sensitive personal data. Collect only data the user is authorized to access. Sanitize all rendered model and page text (no raw HTML injection into the UI).

### 15.4 Manifest V3 compliance
No remote code, no eval in extension contexts, a strict content security policy, minimal permissions, optional host permissions requested in context.


## Current execution scope
The PDF provides staged sessions: complete M0 and M1 first. Do not start M2 until M1 is verified. The requested initial stack and M0 permissions are part of the user-authorized build; the STOP-AND-ASK rule applies to additions or changes beyond this baseline. No remote publication. Existing /workspace/Vistara is unrelated and must remain untouched.
