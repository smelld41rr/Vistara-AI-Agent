# Current M2.1 report

See [M2.1-TEST-REPORT.md](M2.1-TEST-REPORT.md) for version 0.2.1 final executed results and current verification boundaries. Earlier M0/M1 report below is historical.

# Historical M0/M1 report

For current M2 results see M2-TEST-REPORT.md (95 unit/integration + 18 baseline + 15 M2 fixture checks; native M2 unverified).

# Test report — Vistara AI 0.1.0

Date: 2 November 2026. Scope: staged M0/M1 read-only build. No live API key supplied. No third-party live-site checks, publication or remote push.

## Final executed checks
| Command | Observed result | Category |
|---|---|---|
| `npm run build` | EXIT 0; WXT 0.21.5 production Chrome MV3 build | Build |
| `npm run typecheck` | EXIT 0; strict TypeScript | Static |
| `npm run lint` | EXIT 0; ESLint | Static |
| `npm test` | EXIT 0; 66 tests / 6 files | 55 unit + 11 controller integrations; Chrome/HTTP mocked where applicable |
| `npm run test:e2e` | EXIT 0; 18 checks, zero console/page errors | Compiled production UI/reader in real Chromium with mocked privileged Chrome/backend; real IndexedDB |
| `node scripts/audit.mjs` | See archive audit checkpoint below | Static built-manifest/credential-pattern audit |
| `node scripts/package.mjs` | See archive audit checkpoint below | Local archive integrity/exclusion/secret-pattern checks |

Final universal-gate rerun output was observed directly: build=0, typecheck=0, lint=0, test=0; Vitest 66/66. Local raw logs reside in work/ and are excluded from source deliverables. Prior final browser run is recorded in browser-results.json; 18/18, zero errors, Chromium 154.0.8037.57.

## Test inventory
- core.test.ts: 11 unit cases — protocol validation, mock RPC roundtrip/mismatched IDs, conservative settings, packaged caller authentication, redaction including split-key suffixes, safe URLs/untrusted delimiters.
- providers.test.ts: 24 unit cases — scripted Gemini/Groq discovery, SSE/JSON/tools, error classification, bounded retries, no 429 retry, cancellation/timeout/stream budgets, deterministic mock provider.
- reader.test.ts: 12 DOM unit cases — actual text/metadata, hidden/offscreen/sensitive/editable exclusions, bounded traversal, selection, open shadow DOM, unsafe URLs and injection warnings.
- storage.test.ts: 7 unit cases — simulated Chrome session/local key storage, explicit local opt-in, removal/trusted access/settings validation.
- manifest.test.ts: 1 build integrity case — exact minimal permissions, no inferred hosts/static content injection, provider-only optional origins, CSP.
- controller.test.ts: 11 integrations — actual controller/provider adapter with simulated Chrome/storage and scripted HTTP: consent, page-context isolation, actual fixture text, quota stop, cancellation, provider-history isolation, restricted/navigation races, no executable action tools, split secrets, pending start controls, persistence failure always emits final events.

## Browser category details
The 18 checks execute compiled production bundles in /usr/bin/chromium on localhost. Chrome APIs and the UI backend are explicitly substituted; this is not native-extension verification. They cover reader privacy/reinjection, real IndexedDB commits read from a second connection, recovery/deletion, responsive 320/400/480 panels, settings/consent/key/model controls, streamed safe rendering, actual fixture content via a scripted provider, cancellation, 401/403/429 recovery, parsed JSON history export, restore/clear, keyboard focus. Screenshots are fixture UI captures only; provenance in screenshots/README.md.

## Native-extension gate: BLOCKED
A fresh persistent Chromium launch with standard unpacked-extension flags did not load the production worker. Managed policy ExtensionInstallBlocklist=["*"] was observed. Policy was not changed or bypassed. Real side-panel opening, activeTab privileges, session-access enforcement, native service-worker suspension and Windows installation remain unverified. docs/NATIVE_VERIFICATION.md contains evidence and the unmanaged Windows manual checklist.

## Live providers: NOT RUN
Gemini/Groq live model discovery and generation were not run because no user API key was supplied. No actual model/free-tier/quota claim is inferred from mocks. Connection test implementation lists models only, not generation eligibility.

## Corrections during development
Initial build attempts failed while parallel UI files were still being written. Typecheck caught strict indexed-access errors, which were fixed. ESLint caught a regex escape, fixed. Manifest audit caught WXT-inferred broad host grants, removed by switching to an unlisted reader. Early browser-harness failures were selector/event-substitute mismatches and were corrected; final browser run passed. Final review added regression-tested fixes for partial-key streaming, pending-start cancellation and persistence failure error delivery. These earlier attempts are not counted as passes.

## Archive audit checkpoint
`node scripts/audit.mjs`: EXIT 0 / PASS, 14 production files, 601,454 uncompressed bytes. Exact permission baseline, no static hosts/content scripts, provider-only optional origins, asset existence/CSP, credential-shaped literal and test-canary scan, no executable eval/Function or remote HTML script tags.

`node scripts/package.mjs`: EXIT 0. Both ZIP CRC/integrity and credential-pattern scans PASS. Chrome ZIP has manifest.json directly at root; source ZIP contains configs, editable source, tests/docs and screenshots, excluding node_modules/.git/.env/build caches/work logs. Current file hashes and archive entry counts are in release/archive-verification.json and SHA256SUMS.txt (distributed alongside artifacts).

Documentation was finalized after the first successful archive check, then packaging was rerun to include the final report. Heuristic scans do not prove the absence of every possible secret. Archive integrity does not certify native installation.

## Artifact export

Archive files are verified in release/. Attachment export to the configured projectless output folder is BLOCKED by read-only filesystem; there is no callable artifact-upload tool. docs/DELIVERY.md gives exact shared-workspace retrieval paths. Paths are not claimed as downloadable links.
