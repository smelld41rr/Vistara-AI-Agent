# Install on Windows (Chrome 120+)

1. Download Vistara-AI-Chrome.zip and extract it to a permanent folder. Do not select the ZIP itself.
2. Open chrome://extensions. Enable Developer mode. If your organization blocks this, contact the administrator; do not bypass policy.
3. Click Load unpacked. Choose the extracted folder whose root contains manifest.json.
4. Pin Vistara AI. On a normal HTTP/HTTPS webpage click its toolbar icon and Open assistant. This gesture provides temporary activeTab access.
5. Settings → select Gemini or Groq. Read/accept the cloud disclosure, enter your own key, keep session-only storage unless you deliberately opt into local persistence.
6. Test connection (approve the requested provider API host). Choose a returned text model. Model availability does not prove free-tier eligibility; check your provider dashboard. Save settings.
7. Send a chat. To summarize the actual page enable Include current page, optionally preview, then send. Keys are never entered into the webpage.

Native extension installation was not verified on Windows in this Linux environment. See TEST_REPORT and NATIVE_VERIFICATION. No live API response is claimed without a user key. Keep the install folder on disk; update files then press Reload. Refresh website tabs and reopen from the toolbar when activeTab access expires after navigation. PDF/Chrome/Web Store pages are restricted.

## Build from source
Install Node >=24.15 and npm. Run npm ci, npm run build. Load .output/chrome-mv3. Run npm run typecheck, npm run lint, npm test, npm run test:e2e. npm run zip creates extension and source ZIPs in release/.

## M2 (0.2.0)
Use Vistara-AI-M2-Chrome.zip; keep the old M0/M1 ZIP as rollback. Extract to a stable folder, reload at chrome://extensions and reload website tabs. Chat stays read-only. Tasks requires a configured Gemini model, per-provider cloud consent, explicit per-task observation-sharing checkbox and an exact-site grant. Enter exact text to type in the goal; inspect every edit/click/destination approval. Use Pause/Resume/Stop and review actual trace statuses. Host grants may persist in Chrome; revoke in extension Details → Site access. See docs/M2-NATIVE-VERIFICATION.md for the nine-command acceptance checklist; native M2 has not been verified in this managed environment. Do not enable organization-policy bypasses.
