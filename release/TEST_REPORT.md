# Vistara AI NanoBrowser-source rebuild — actual test report

2 November 2026. Rebuild 0.3.0, pinned NanoBrowser source 19dc8e8a9be6ed06c0ef9ec7de8d84bf6a88c458. At validation time no fork, push, publication or deployment was performed. GitHub delivery/replacement was subsequently authorized; test results below are unchanged.

## Executed results

| Command/check | Actual result |
|---|---|
| corepack enable --install-directory (isolated tools directory) | PASS |
| pnpm install --frozen-lockfile on original toolchain | FAILED initially: SWC native cache ancestry rejected; no security check bypass |
| pnpm install after necessary build-only compiler fix | PASS, pnpm 10.34.7 / isolated Node 24.22.1 |
| pnpm type-check | PASS |
| pnpm lint | PASS |
| pnpm test | PASS: 805 tests, 72 test files; 4 live-provider tests / 1 suite skipped |
| pnpm build | PASS, Chrome MV3 dist/ |
| pnpm zip | PASS, dist-zip/vistara-ai-0.3.0.zip |
| supported pnpm autorun appearance,providers-test,panel-run | BLOCKED: sandbox SIGABRT, zero native reports; managed extension policy also blocks installation |
| Compiled UI rendering smoke | BLOCKED: no rendered DOM/screenshot; separate Chrome data-URL probe also failed |
| Primary GitHub/WayHome task, live tool calling and voice | UNVERIFIED: no live key / native browser environment |
| ZIP/source/legal/secret checks | Final generated verification in release/REBUILD-VERIFICATION.json |

The project uses the actual upstream source, SDK/provider factories, agent, stable refs, Puppeteer frame management, Chrome debugger/CDP engine, receipts/verification, safety and fixture infrastructure. Old M2.1 regression numbers do not apply to this replacement architecture. No old read-only/automation controller is retained.

One build-only correction was required: @vitejs/plugin-react-swc could not load its native binding in this managed filesystem (ERR_SWC_NATIVE_CACHE). The supported Vite React Babel plugin 5.2.0 replaces it, preserving WXT/Vite/React and all runtime dependencies. No agent/browser/provider redesign. Upstream autorun cleanup now handles signalCode and has bounded termination, reporting actual browser stderr instead of hanging.

Warnings retained: Puppeteer BrowserConnector's unused node:path path is browser-externalized by Vite; minified chunks exceed Vite's advisory 500 kB threshold. Build succeeds; native runtime acceptance is still required. No warning is presented as a native pass.

Network/privacy: all production telemetry destinations are disabled in code; old build variables cannot enable them. Defaults are off and collection switches were removed from user-facing setup/privacy cards. Local fixture-only analytics plumbing remains for upstream regression coverage and requires explicit fixture setup. Original uninstall Google Form is cleared; product links/feedback point to Vistara, without UTM parameters. OpenRouter identification is Vistara. API/voice traffic remains to user-selected provider endpoints. Required original/dependency attribution is retained.

Upstream source identity was verified recursively against all 27 pinned root Git object hashes, not just its ZIP filename. Native/live acceptance details and the manual checklist are in NATIVE_VERIFICATION.md. Static credential scans are heuristic, not a proof of absence of every possible secret; no local browser profiles/caches/real keys are packaged.
