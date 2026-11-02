# Vistara-AI-Agent

## Downloads

- [Download Chrome extension ZIP](https://github.com/smelld41rr/Vistara-AI-Agent/raw/refs/heads/main/release/Vistara-AI-Chrome.zip)
- [Download editable source ZIP](https://github.com/smelld41rr/Vistara-AI-Agent/raw/refs/heads/main/release/Vistara-AI-Source.zip)
- [SHA256 checksums](release/SHA256SUMS.txt)

Extract the Chrome ZIP, then use Chrome → chrome://extensions → Developer mode → Load unpacked. This is the staged M0/M1 read-only build; full autonomous browser actions/workflows/schedules remain pending. See verification limits below.

## Vistara AI

A local-first Chrome side-panel assistant with your own Gemini or Groq key. No Vistara subscription, registration, backend or local model required. AI content is processed by the chosen external provider, subject to that provider's terms, availability and limits.

**Staged implementation: M0/M1 read-only assistant. This is not the completed browser automation agent.** Browser actions, autonomous tasks, multi-tab comparison, structured extraction studio, workflows and schedules are not built yet. Navigation labels make this explicit.

## Install
Extract Vistara-AI-Chrome.zip to a permanent folder. Open chrome://extensions → Developer mode → Load unpacked → select the folder with manifest.json. Chrome 120+; Windows instructions in docs/INSTALL_WINDOWS.md. Click the toolbar popup → Open assistant. Configure your provider key, test/discover models, choose a model, accept cloud disclosure and save preferences. Page context is OFF until you explicitly enable it.

**Verification boundary:** production builds, unit/integration and compiled-fixture browser tests are reported separately in docs/TEST_REPORT.md. Native unpacked extension loading is BLOCKED by this environment's managed ExtensionInstallBlocklist policy. Windows/native live behavior is not certified. Live Gemini/Groq generation is NOT RUN because no user key was supplied. No policy was bypassed.

## Development
Node >=24.15 and npm. `npm ci`, `npm run build`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:e2e`. Load `.output/chrome-mv3`. `npm run zip` generates verified source/extension archives. Browser tests require Chromium (`CHROMIUM_PATH`, default /usr/bin/chromium) and localhost sockets. No remote publication or pushes.

## Design and modules
`src/entrypoints`: worker, popup, sidepanel and on-demand unlisted reader. `src/core`: Zod RPC, settings/session secrets, IndexedDB history and controller. `src/features/providers`: independent REST adapters. `src/features/browser`: bounded read-only DOM snapshot. `src/components`, `src/styles`: original responsive UI with light/dark/system, density and font preferences. `tests`: deterministic units, integrations, static local fixture pages and real Chromium renders with explicitly mocked APIs. `docs`: architecture, progress, decisions, test evidence and manual verification.

## Privacy
Keys default to trusted session storage. Local persistence only with explicit disclosure; browser storage is not a secret vault. Input values are not read at all; visible-page content is shared only after provider consent plus page-context opt-in. Reader snapshots are untrusted data, never executable instructions. No arbitrary code execution tool. No telemetry, remote executable code or background history collection. See docs/SECURITY.md and docs/KNOWN_LIMITATIONS.md.

## Build inputs
Both supplied documents were read in full: 11-page Vistara AI Build Prompts PDF and 280-line Vistara AI Master Prompt. Staged PDF gates govern progression: M0/M1 first; M2 cannot begin until the prior gate is verified. The unrelated original /workspace/Vistara appearance extension remains untouched. Initial specified stack/permissions were treated as the user-authorized baseline; no additions beyond that baseline without review.

Packaging from source additionally requires Python 3 available as `python`; installing the prebuilt extension does not require Python or Node.

Artifact retrieval: see docs/DELIVERY.md. ZIPs are in release/. The configured projectless output path is unavailable/read-only here; no filesystem path is presented as a working attachment link.
