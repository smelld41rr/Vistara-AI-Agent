# Vistara AI 0.3.3 — NVIDIA and universal compatible providers

4 November 2026. Existing NanoBrowser-based project and local branch `rebuild/nanobrowser-vistara`; previous argument/Ollama work preserved. No GitHub push, fork, publication or deployment in this task. No new dependency, paid service, credentials or browser-control architecture replacement.

## Implementation

The existing `openai-compatible` kind and SDK Chat Completions factory are extended rather than duplicated. Six presets added: NVIDIA NIM, Groq, Together AI, Cerebras, Fireworks AI and DeepInfra. Official endpoint/protocol evidence and setup: [PROVIDER_PRESETS.md](PROVIDER_PRESETS.md). All existing providers/presets remain; new DeepSeek presets use its current documented root URL while existing stored endpoints remain untouched.

The existing full-page Providers card supplies name, explicit Chat Completions protocol, base URL, isolated key, exact model ID, listing/refresh, manual add, separate connection/text/tool tests, default model and optional timeout. No arbitrary protocol support is claimed. Existing full Settings tab/navigation, Vistara theme, storage subscriptions and Ollama support remain. The welcome flow now preserves passing readiness fields when saving a tested compatible/Ollama model.

Custom model readiness is persisted separately from text readiness. Agent selection requires a passing structured tool diagnostic. Tools diagnostics call the existing SDK/stream path, validate strict ClickArgsSchema/SetArgsSchema and exact public synthetic inputs, then submit the returned tool-call ID in an assistant/tool-result continuation and require a valid text completion. These diagnostic calls never execute a webpage action. Browser tasks still use the original catalogue, current refs, permissions, approvals, Stop and observable verification. No Zod or engine checks are disabled.

Adding a compatible model reads metadata without paid inference; explicit test buttons may consume configured-provider quota. The default SDK endpoint is never used when a custom URL is missing. URL normalization preserves provider-specific prefixes/version paths and rejects full operation URLs, embedded credentials, query, fragment and non-HTTP schemes. Remote HTTP warns; localhost is retained. Compatible inference and discovery use redirect:error. Errors distinguish authentication, billing/credits, rate limiting, unavailable provider, model/endpoint, context, timeout, text and tool failures. Browser network errors cannot conclusively distinguish CORS from all extension/network restrictions; guidance states this limitation.

## Security fixes

Endpoint editing is now a local draft. An inline review requires an explicit click before mutation. Confirmation rotates the provider identity, removes the old key/results and updates its default-model reference without forwarding old credentials. There are no requests on endpoint confirmation. Other provider keys and explicit context overrides survive. Old in-flight endpoint tests cannot save to the new ID.

Saving/clearing a key clears compatibility facts and increments a credential revision. Test persistence checks revision as well as endpoint/ID, preventing tests with old credentials from restoring Agent Ready. A removed or unready explicit model no longer silently falls back to another provider; an already-tested model on the same provider can be used under existing selection behavior.

Keys remain in the existing isolated ordinary Chrome local storage restricted to TRUSTED_CONTEXTS through the supported storage access-level API, not Vistara encryption. No keys are added to source, logs, URLs or exports; custom diagnostic errors use fixed explanations and the SDK stream error masks a saved key if a provider echoes it. Source packages omit internal instructions, environment/secret files, caches, dependencies, logs and Git metadata. Secret scans are heuristic, not a guarantee against every possible secret format.

## Actual verification

| Check | Actual result |
| --- | --- |
| TypeScript `pnpm type-check` | PASS |
| `pnpm lint` | PASS, zero warnings/errors |
| `pnpm test` | 895 passed, 4 live-provider tests skipped; 81 passed files, 1 skipped suite |
| `pnpm build` | PASS, Chrome MV3 version 0.3.3 |
| `pnpm zip` | PASS, root manifest and options tab metadata checked by packaging |
| Source/history/diff/build/archive pattern and integrity checks | See release/CUSTOM-PROVIDERS-VERIFICATION.json |
| NVIDIA/custom API testing | Real SDK serialization/parsing with simulated HTTP/SSE; NO real provider inference |
| Native Chrome `providers-test,argument-controls` | BLOCKED / UNVERIFIED: Chromium SIGABRT at sandbox helper startup; zero reports |
| Live NVIDIA/Groq/Together/Cerebras/Fireworks/DeepInfra | UNVERIFIED: no user API credentials supplied/configured |

Focused tests cover exact NVIDIA bearer/header/model/path, vendor-specific base normalization, missing URL/no credential dispatch, invalid target strings/nested IDs, text-only rejection, wrong tool-result continuation, exact call-ID preservation, redacted errors, credential isolation and endpoint confirmation, preservation of model/context/default preferences, stale-key test refusal, readiness and no cross-provider fallback. Existing argument/editor, Ollama, storage and agent tests remain. Updating the legacy fallback test reflects the user's requested no-silent-provider-switch behavior; it was not removed. The native providers fixture was updated for the new manual-add label and scripted structured-tool/continuation responses. That fake-provider fixture remains distinct from a live API.

Native command: `CHROME_PATH=/usr/bin/chromium pnpm autorun providers-test,argument-controls --timeout 15`. Ignored local evidence: fixtures/.results/2026-11-04T16-24-26-015Z-providers-test+argument-controls.json. The SUID sandbox helper is misconfigured; no sandbox/security-policy bypass was attempted. Existing managed extension-install restrictions remain. No screenshot or real webpage success is claimed.

## Remaining acceptance / limitations

On an authorized Chrome/Edge installation, load the unpacked ZIP, configure your key and exact supported model ID, and run connection, text and tool tests. If /models is unsupported, add the model manually and run text/tools directly. Verify Configured/Chat Ready/Agent Ready/Test Failed, endpoint review/key removal, stored-provider updates in the sidebar and your default selection. Then run “Open GitHub, find Repositories and click it” and controlled Java-editor entry, checking actual receipts/readback and cancellation. Consequential submissions must retain their existing approval/handover gates.

Synthetic probes are limited evidence: they do not establish every provider/model feature or guarantee reliability with the entire tool catalogue. Arbitrary protocols and non-streaming-only incompatible services need explicit future adapter work. Other pre-existing native fixture suites were not executed in this blocked environment; fixtures which seed untested custom entries require explicit compatibility setup under the new readiness policy. The definition of done requiring live-provider native browser automation is not established here.

## Modified files and artifacts

This task: src/llm/{provider-presets.ts,index.ts,providers.ts,connection.ts,model-info.ts,stream.ts}; src/options/{ProvidersSection.tsx,model-test.ts,provider-security.ts,compatible-test.ts,Welcome.tsx}; src/store/{settings,storage}.ts and storage tests; three locale catalogues; src/background/checks/providers-test.ts; src/extension/__tests__/live-pair.test.ts; new src/options/__tests__/{compatible-test,provider-security}.test.ts. Version, package script, NOTICE/public NOTICE, README/CHANGELOG/SECURITY and architecture/test/native/change documentation updated. Browser-control files themselves are unchanged by this task; previous guarded-target fixes remain.

Deliverables: Vistara-AI-Custom-Providers-Chrome.zip, Vistara-AI-Custom-Providers-Source.zip, SHA256SUMS-Custom-Providers.txt and CUSTOM-PROVIDERS-VERIFICATION.json in release/. Editable Source ZIP includes the current working tree, excluding internal AGENTS.md/CLAUDE.md. Local HEAD remains 0a6f87c with uncommitted working-tree changes; prior remote upload 09f0805 is unchanged by this task. No push is authorized by this request.
