# Vistara AI source rebuild plan

Pinned upstream: nanobrowser/nanobrowser @ 19dc8e8a9be6ed06c0ef9ec7de8d84bf6a88c458. User-provided archive comment matches and GitHub commit exists. Existing Vistara remote baseline c35898d; local backup 6ec0a45. Full old tracked tree archived outside application; Git history retained. No fork/remotes/push.

Replace, do not merge: agent → browser-control → chrome.debugger CDP → input receipts/verification → agent. Retain all upstream source and fixtures. Modify user-facing branding/theme/icons, Apache change notices, product links, telemetry production destination/defaults and uninstall feedback. Keep native provider SDK integrations, Ask/Auto/user handover, stable refs, frame management and lifecycle checks. Namespace internal nb identifiers is retained to avoid breaking upstream protocol/tests; legacy Vistara data is not silently migrated or erased.

Build-only compatibility correction: the pinned @swc native binding refuses this managed filesystem cache ancestry (ERR_SWC_NATIVE_CACHE), even using a private cache. Use the standard Vite React Babel plugin 5.2.0 (documented Vite 8 peer support) instead of the SWC plugin. No browser, agent, provider or UI runtime architecture changes. Existing SWC dependency is removed rather than shipping duplicate build toolchains.
