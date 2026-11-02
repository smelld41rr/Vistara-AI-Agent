# Test plan

Universal checks: npm run build, npm run typecheck, npm run lint, npm test.
Unit: Zod protocols, storage, redaction, error classification, provider model discovery, stream cancellation, no retry on quota, per-provider consent and context bounds.
Fixture-browser: article/form/table/injection pages; compiled page reader on real DOM; hidden/sensitive/offscreen content excluded; actual fixture text sent to scripted mock provider. Responsive React panel at 320/400/480, keyboard and functional buttons. These tests may mock Chrome APIs and are labeled accordingly.
Native-extension: launch production build in persistent Chromium, inspect worker and open sidepanel. Record native loading failure and administrator policy if observed; do not bypass it.
Live Gemini/Groq: NOT RUN unless user key is supplied via env; never print it.
Packaging: ZIP root manifest, assets present, no .env/node_modules/secrets, hash both archives.
