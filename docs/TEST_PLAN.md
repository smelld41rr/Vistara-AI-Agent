# Test plan

Universal checks: npm run build, npm run typecheck, npm run lint, npm test.
Unit: Zod protocols, storage, redaction, error classification, provider model discovery, stream cancellation, no retry on quota, per-provider consent and context bounds.
Fixture-browser: article/form/table/injection pages; compiled page reader on real DOM; hidden/sensitive/offscreen content excluded; actual fixture text sent to scripted mock provider. Responsive React panel at 320/400/480, keyboard and functional buttons. These tests may mock Chrome APIs and are labeled accordingly.
Native-extension: launch production build in persistent Chromium, inspect worker and open sidepanel. Record native loading failure and administrator policy if observed; do not bypass it.
Live Gemini/Groq: NOT RUN unless user key is supplied via env; never print it.
Packaging: ZIP root manifest, assets present, no .env/node_modules/secrets, hash both archives.

M2: tests/unit/automation.test.ts; tests/integration/agent.test.ts; npm run test:m2 (actual DOM/navigation fixture plus actual manager/REST scripted Gemini integration and UI controls). Retain npm run test:e2e baseline. Native nine-command matrix is separate and UNVERIFIED if blocked. Scan source, all available Git history diffs, pending changes, reports and ZIPs before public upload. No force push or unrelated deletion.

M2.1: baseline M0–M2 regressions first; URL validation/local HTTP and redirect rejection; catalog protocol/auth; discovery/text/SSE/native Anthropic/tool feedback; 503 vs parser/unsupported/auth/quota errors; deterministic compatibility probes; idempotent legacy migration preserving session/local keys and history; manual-model profiles; proof invalidation; default/provider switching and history isolation; compiled Hub UI fixtures and native acceptance separation. No live credentials or unapproved provider traffic in automated tests. M2.1 archives and source/history/report secret scan before delivery; no GitHub push without new approval.
