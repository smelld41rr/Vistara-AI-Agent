# Vistara AI 0.3.2 — Ollama and full-page Settings

3 November 2026. Existing local branch `rebuild/nanobrowser-vistara`, based on local HEAD `0a6f87c`. Prior uncommitted argument fixes are preserved and included. No new project, upstream download, dependency, model download, GitHub fork/push, deployment or store publication.

## What inspection confirmed

Upstream-derived code already had the standalone options entrypoint with `manifest.open_in_tab=true`, seven sections, Ollama's OpenAI-compatible SDK factory, `/api/tags` listing, `/api/show` and `/api/ps` context detection, provider management and live storage subscriptions. These were preserved. The main Settings icon already called `chrome.runtime.openOptionsPage()`; direct Providers/Permissions links created duplicate tabs. The old generic compatibility check accepted a tool name without validating its arguments. Local untested models could previously be selected.

## Resulting behavior

- Settings opens the extension's full options page, using Chrome's options-page mechanism. Direct section links find the exact extension options URL, reuse/focus it across windows or create one tab, and set `#providers`/`#permissions`. The helper touches no conversation, task, run or model state. Same-page concurrent requests are serialized. Chrome's general options-page reuse and multiple simultaneous requests from separate extension contexts still need native acceptance; no cross-context atomic lock is claimed.
- General, AI Providers, Permissions, Shortcuts, Memory, Data & Privacy and About remain in the existing responsive settings UI and Vistara dark/light theme. Existing Memory section/status is retained; no new memory engine is invented.
- Ollama is labeled **Ollama (Local)**, no key required, default server `http://localhost:11434`. Existing adapter normalizes trailing `/v1`, including repeated suffixes, to one OpenAI-compatible endpoint. Ollama URLs reject non-HTTP protocols, embedded credentials, query and fragment.
- List Models connects to the configured server and displays only returned installed models as selectable names. It can be refreshed. Empty or malformed lists are reported; there is no synthetic recommended-model availability or automatic pull. Manual entries remain unready until server membership and diagnostics pass.
- Existing editable name/server, default selection, model/provider removal and saved settings subscriptions remain. Each model has Test Model; provider-wide testing stays available. Queued failures are caught so subsequent tests can run. Old endpoint model lists/results are cleared; stale test saves are rejected. Names/explicit overrides are retained on endpoint changes.
- Local request timeout is editable from 5 to 600 seconds, default 120 seconds per inference attempt, with existing agent retry/iteration limits preserved. Metadata/list requests are bounded at 15 seconds. Existing context detection, reasoning capabilities/effort, usage accounting and compaction remain. Other provider inference timeout behavior is unchanged.
- All current provider kinds and presets remain: Gemini, OpenAI, Anthropic, OpenRouter, LM Studio, DeepSeek, Mistral, xAI and custom compatible endpoints. Ollama becoming unready does not silently select a different provider. An already-tested model in the same provider can remain a fallback under the existing selection behavior.

## Tool-calling and safety

Ollama's Test Model uses the actual existing SDK/stream path. It first checks `/api/tags` membership, then asks for separate structured `click` and `set` calls with a synthetic `g29` ref and public test text. It validates tool names/counts, exact expected arguments and the original strict ClickArgsSchema/SetArgsSchema. **These test tools are never dispatched to a browser.** Only both passing requests persist Agent Ready. Untested/failed Ollama entries cannot be selected/resolved for Agent mode; a failed retest clears readiness. Endpoint changes clear prior facts.

Agent Ready means structured-format diagnostics passed on that server/model, not guaranteed browser success or exhaustive model reliability. Browser tools remain the original model-independent catalogue and CDP engine: observation, click/set/type/press, navigation, tabs, scroll/wait and completion. No alternate Ollama browser engine or tool capability removal.

The previous argument fix is preserved: model-facing ref/semantic objects, original strict Zod schemas, agent-only safe bare-ref adaptation only after current observation/session/tab/live identity checks, no selector/coordinate workaround or element substitution, bounded invalid recovery, Stop, existing permissions/approvals and honest receipts. Simulated Ollama SSE with `{"target":"g29"}` and `{"target":{"id":"g29"}}` fails compatibility; `{"target":{"ref":"g29"}}` passes. These are simulated payloads, not observed local Ollama production output.

Generic diagnostic `report_status` arguments are now also strictly validated, so a tool name alone cannot establish compatibility. No source code/private pages/credentials are supplied to these diagnostic requests.

## Local errors and setup

The card supplies actionable connection, missing model, unsupported tool, malformed response, context/memory and timeout guidance. Browser network errors cannot conclusively distinguish missing installation, stopped server, refused connection and some CORS failures; guidance explicitly states that ambiguity. Check logs before changing origin settings.

Origin help inserts the exact `chrome-extension://<current-id>` in Windows/macOS/Linux commands, without wildcard access or public binding. Tests verify the displayed origin is the extension origin, not the opaque URL `null` origin. Full instructions: [OLLAMA_SETUP.md](OLLAMA_SETUP.md). Keep Ollama private; no paid service or Ollama Cloud is required.

## Executed checks and evidence

| Check | Actual result |
| --- | --- |
| pnpm type-check | PASS |
| pnpm lint | PASS, zero errors/warnings |
| pnpm test | PASS: 868 passed, 4 live-provider tests skipped; 79 passed files, 1 skipped suite |
| pnpm build | PASS, Chrome MV3 production output |
| pnpm zip | PASS, version 0.3.2 |
| Source/build/history/ZIP secret-pattern and legal/integrity checks | Recorded in release/OLLAMA-SETTINGS-VERIFICATION.json; scans are heuristic |
| Settings/model persistence/live subscriptions | Mocked Chrome storage/API tests; not native tab/UI verification |
| Tool compatibility | Actual SDK with simulated HTTP/SSE; not running Ollama inference |
| Existing browser-control/argument/editor regression suite | Unit/integration with mocked CDP and fixtures; not real browser dispatch |
| Native harness appearance,providers-test,argument-controls | BLOCKED: Chromium SIGABRT before checks; zero browser reports |
| Running local Ollama model | UNVERIFIED: no Ollama executable found; localhost:11434 connection refused |

Native command executed: `CHROME_PATH=/usr/bin/chromium pnpm autorun appearance,providers-test,argument-controls --timeout 15`. Report: `fixtures/.results/2026-11-03T12-06-49-317Z-appearance+providers-test+argument-controls.json` (ignored local evidence). Browser stderr identified the SUID sandbox helper ownership/mode failure. Existing managed extension-install restrictions also remain. No sandbox/policy bypass. No fixtures or mocks are labeled native success.

Focused tests cover new-tab mechanism, direct route/tab reuse, persisted provider/default settings, original-settings retention, storage subscriptions, readiness failures, endpoint invalidation/stale save refusal, provider retention, normalized endpoints, installed-only list, exact extension origin, actual SDK wire serialization with valid/malformed targets and missing-model prevention. An existing Ollama selection fixture now explicitly marks its working mock model as tested, matching the new readiness requirement; it is not production diagnostic evidence.

## Native acceptance — all UNVERIFIED here

1. On an authorized Chrome/Edge installation, extract/load the Chrome ZIP. Click Settings while a sidebar task is active; confirm one full extension Settings tab, seven sections, preserved task/chat and functional hash navigation. Reopen Providers and confirm tab reuse.
2. Start your own local Ollama. Add Ollama (Local), List Models, compare exact installed tags with Ollama. Verify empty/not-running/bad-URL behavior and no downloads.
3. Add an installed tool-capable model, Test Model, inspect real connection/structured-tool result; choose it as default and confirm sidebar update. Test a model without tool support and verify it remains unavailable to Agent. Change URL and confirm readiness/list invalidation.
4. With the tested model selected, instruct: “Open GitHub, find Repositories and click it.” Verify actual browser navigation, current refs, click receipts, observable page result, tab permissions and Stop. A model tool-format diagnostic does not satisfy this step.
5. On a controlled editor fixture, enter exact Java text and verify readback. Confirm no hidden textarea substitution, no duplicate replay and no fabricated execution/Accepted result. Submission must respect Ask/Auto/site policy and mandatory handover.
6. Reopen Settings/reload the sidebar; retain providers, defaults, existing cloud configurations and stored preferences. Verify light/dark layouts and narrow responsiveness visually.

The user's definition of done requiring actual local-model browser automation cannot be established in this workspace. Native/local inference remains a release acceptance limitation.

## Modified files and delivery

This task: src/ui/options.ts; src/side-panel/{App,WhatsNewCard}.tsx; src/options/{ProvidersSection.tsx,model-test.ts,ollama-test.ts}; src/store/settings.ts; src/extension/models.ts; src/llm/{providers,connection,model-info,stream}.ts; three locale catalogues. Tests: src/ui/__tests__/options.test.ts, src/options/__tests__/ollama-{settings,test}.test.ts, src/llm/__tests__/connection.test.ts, src/extension/__tests__/live-pair.test.ts. Version, packaging, NOTICE/public NOTICE, README, CHANGELOG, SECURITY, AGENTS and architecture/test/change/native reports updated. Prior argument changes remain documented in ARGUMENT_FIX_REPORT.md.

Deliverables: `Vistara-AI-Ollama-Settings-Chrome.zip` and `Vistara-AI-Ollama-Settings-Source.zip`, checksums and packaging verification in release/. Chrome manifest is at archive root and has options_ui.page=options.html, open_in_tab=true. Source excludes internal AGENTS.md/CLAUDE.md guidance, .env, keys/credentials by naming/pattern heuristics, node_modules, Git metadata, caches, generated build folders, local work/logs and release archives. No secrets were intentionally included; static scans have practical limits.

Git status: same branch, local modified/untracked source changes, uncommitted, HEAD 0a6f87c; no remote changes in this task. Complete editable ZIP includes the current working tree, not just HEAD.
