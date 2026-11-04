# Vistara AI source rebuild plan

Pinned upstream: nanobrowser/nanobrowser @ 19dc8e8a9be6ed06c0ef9ec7de8d84bf6a88c458. User-provided archive comment matches and GitHub commit exists. Existing Vistara remote baseline c35898d; local backup 6ec0a45. Full old tracked tree archived outside application; Git history retained. No fork/remotes/push.

Replace, do not merge: agent → browser-control → chrome.debugger CDP → input receipts/verification → agent. Retain all upstream source and fixtures. Modify user-facing branding/theme/icons, Apache change notices, product links, telemetry production destination/defaults and uninstall feedback. Keep native provider SDK integrations, Ask/Auto/user handover, stable refs, frame management and lifecycle checks. Namespace internal nb identifiers is retained to avoid breaking upstream protocol/tests; legacy Vistara data is not silently migrated or erased.

Build-only compatibility correction: the pinned @swc native binding refuses this managed filesystem cache ancestry (ERR_SWC_NATIVE_CACHE), even using a private cache. Use the standard Vite React Babel plugin 5.2.0 (documented Vite 8 peer support) instead of the SWC plugin. No browser, agent, provider or UI runtime architecture changes. Existing SWC dependency is removed rather than shipping duplicate build toolchains.

## Ollama and Settings update (0.3.2)

Existing options entrypoint remains the single standalone settings interface. src/ui/options.ts opens/reuses the exact extension options tab, preserving conversation/run state. Existing storage subscriptions synchronize provider and default-model changes. No second provider adapter: Ollama uses the existing SDK OpenAI-compatible chat-completions path; tags/show/ps retain upstream discovery/context support. The options-only diagnostic adapter validates model-emitted click/set payloads with the public original schemas without browser dispatch. Ollama Agent selection requires a persisted passing test on the configured endpoint. Existing agent/CDP architecture, safety and other providers remain. See OLLAMA_SETUP.md and OLLAMA_SETTINGS_REPORT.md.

## Custom providers 0.3.3

Existing compatible adapter and provider cards are extended with documented presets; no browser engine changes. Options-only diagnostics use original public schemas and the real SDK/stream transport without browser dispatch. Endpoint edits are drafts until confirmation; identity rotation and credential revisions protect key destination and stale test persistence. Protocol selection describes only the implemented Chat Completions path. See CUSTOM_PROVIDERS_REPORT.md and PROVIDER_PRESETS.md.
