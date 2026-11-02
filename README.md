# Vistara-AI-Agent

## Downloads — M2 browser tools (0.2.0)

- [Chrome extension ZIP — M2](https://github.com/smelld41rr/Vistara-AI-Agent/raw/refs/heads/main/release/Vistara-AI-M2-Chrome.zip)
- [Editable source ZIP — M2](https://github.com/smelld41rr/Vistara-AI-Agent/raw/refs/heads/main/release/Vistara-AI-M2-Source.zip)
- [M2 test report](release/M2-TEST-REPORT.md) · [Native Chrome manual checklist](release/M2-NATIVE-VERIFICATION.md) · [M2 SHA256](release/SHA256SUMS-M2.txt)
- Earlier M0/M1 packages remain in release/ for rollback.

Extract the M2 Chrome ZIP, then Chrome → chrome://extensions → Developer mode → Load unpacked (or reload existing installation). Current Chat remains read-only. **Tasks** supports the eleven scoped browser tools, Gemini function calling, permission requests, exact action approvals, pause/resume/stop and execution trace. Separate task page-sharing consent is required. No arbitrary JS, credentials, hidden cross-site access or automatic paid/provider switch.

M2 native Chrome acceptance is **UNVERIFIED** here because managed browser policy blocks unpacked extensions. Actual DOM/tabs/navigation are fixture-tested with Chrome transport and Gemini HTTP responses simulated; do not mistake this for native or live-Gemini evidence. User reports M0/M1 manual Chrome verification. M3, workflows, recorder and schedules are not implemented. See docs/M2-TEST-REPORT.md and M2-NATIVE-VERIFICATION.md.

## Vistara AI

A local-first Chrome side-panel assistant with your own Gemini or Groq key. No Vistara subscription, registration, backend or local model required. AI content is processed by the chosen external provider, subject to that provider's terms, availability and limits.

**Current scope: M2 browser automation tools plus preserved M0/M1 read-only Chat.** Gemini Tasks use bounded tool calls and explicit approvals. Full M3 planning, multi-tab research studio, structured exports, workflows and schedules remain pending.

## Install
Extract Vistara-AI-Chrome.zip to a permanent folder. Open chrome://extensions → Developer mode → Load unpacked → select the folder with manifest.json. Chrome 120+; Windows instructions in docs/INSTALL_WINDOWS.md. Click the toolbar popup → Open assistant. Configure your provider key, test/discover models, choose a model, accept cloud disclosure and save preferences. Page context is OFF until you explicitly enable it.

**Verification boundary:** production builds, unit/integration and compiled-fixture browser tests are reported separately in docs/TEST_REPORT.md. Native unpacked extension loading is BLOCKED by this environment's managed ExtensionInstallBlocklist policy. Windows/native live behavior is not certified. Live Gemini/Groq generation is NOT RUN because no user key was supplied. No policy was bypassed.

## Development
Node >=24.15 and npm. `npm ci`, `npm run build`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:e2e`. Load `.output/chrome-mv3`. `npm run test:m2` checks actual DOM fixtures with mocked Chrome transport. `npm run zip:m2` generates M2 source/extension archives; packaging requires Python 3. Browser tests require Chromium (`CHROMIUM_PATH`, default /usr/bin/chromium) and localhost sockets. No remote publication or pushes.

## Design and modules
`src/entrypoints`: worker, popup, sidepanel and on-demand unlisted reader. `src/core`: Zod RPC, settings/session secrets, IndexedDB history and controller. `src/features/providers`: independent REST adapters. `src/features/browser`: bounded read-only DOM snapshot. `src/components`, `src/styles`: original responsive UI with light/dark/system, density and font preferences. `tests`: deterministic units, integrations, static local fixture pages and real Chromium renders with explicitly mocked APIs. `docs`: architecture, progress, decisions, test evidence and manual verification.

## Privacy
Keys default to trusted session storage. Local persistence only with explicit disclosure; browser storage is not a secret vault. Input values are not read at all; visible-page content is shared only after provider consent plus page-context opt-in. Reader snapshots are untrusted data, never executable instructions. No arbitrary code execution tool. No telemetry, remote executable code or background history collection. See docs/SECURITY.md and docs/KNOWN_LIMITATIONS.md.

## Build inputs
Both supplied documents were read in full: 11-page Vistara AI Build Prompts PDF and 280-line Vistara AI Master Prompt. Staged PDF gates govern progression: M0/M1 first; M2 cannot begin until the prior gate is verified. The unrelated original /workspace/Vistara appearance extension remains untouched. Initial specified stack/permissions were treated as the user-authorized baseline; no additions beyond that baseline without review.

Packaging from source additionally requires Python 3 available as `python`; installing the prebuilt extension does not require Python or Node.

Artifact retrieval: see docs/DELIVERY.md. ZIPs are in release/. The configured projectless output path is unavailable/read-only here; no filesystem path is presented as a working attachment link.
