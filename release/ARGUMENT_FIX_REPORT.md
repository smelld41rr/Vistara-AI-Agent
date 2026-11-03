# Vistara 0.3.1 browser argument fix

Validation performed 2 November 2026 UTC. Existing branch: `rebuild/nanobrowser-vistara`. No push, deployment, store publication or fork in this task.

## Confirmed cause and evidence

The strict TargetSchema accepts structured ref/semantic/selector/point objects. Previously all four variants were advertised to models even though agent sessions do not enable selector/point targeting. The SDK JSON-schema wrapper has no runtime validate hook: valid JSON can pass SDK parsing and fail Session.call safeParse before tab resolution or dispatch. This reproduces the reported target-validation failure for both ordinary click and set; it is not proof of an editor-only defect.

Actual production GUVI raw arguments, selected provider/model and authenticated editor DOM were not provided. Their exact malformed shape and editor implementation remain UNKNOWN. Public GUVI CodeKata landing content does not identify the authenticated editor. No live provider was called.

The actual Gemini SDK serializer/stream parser was exercised with simulated HTTP SSE. Observed test payloads were `{"target":{"ref":"g29"}}`, `{"target":"g29"}`, and `{"target":{"id":"g29"}}`. These are deliberately simulated reproductions, not captured GUVI production requests. The last two pass SDK JSON parsing but fail the original strict target schema.

## Fix and preserved controls

Model-facing schemas now advertise supported ref/semantic objects, including nested form targets, with explicit examples for click/set/type/press/fill_form/find/snapshot. Runtime schemas and controller capabilities remain strict.

Only the trusted extension agent adapter enables bare-ref repair. Original schemas must accept the canonical object. Before any handler, the session checks issued registry identity, permitted tab, session KnownSet, latest observation membership and action sequence, live document/frame identity and context under the existing tab lock. Original handler resolution/actionability, permissions, approvals and cancellation still run. Unknown/stale/cross-tab refs fail closed. Nested id, selectors, coordinates and ambiguous submit/scroll strings are not repaired. No element substitution or automatic replay after dispatch.

Diagnostics contain tool, target shape, allowlisted validation field paths/codes, dispatch/handler status, safely issued refs, stage and bounded provider/model identity. No raw tool requests, typed source, page text, cookies, credentials or API keys are logged. Raw SDK errors are sanitized. First validation failure offers corrected format/fresh observation guidance; repeated invalid shape stops early. Possibly delivered actions retain existing verification handling.

## Editors

Existing trusted Chrome Debugger/CDP input is retained. Textarea/contenteditable selection must succeed before replacement. Visible framework-shaped editables use trusted select-all followed by a read-only selection check; no model-supplied JavaScript or direct editor-model mutation. Readback distinguishes exact match, mismatch and unavailable verification without including inserted source in receipt details.

Native textarea, visible contenteditable and iframe handling use existing layer resolution. Monaco/Ace/CodeMirror hidden internal input targets are not blindly clicked/remapped. Framework containers which are not editable fail with an actionable limitation. Local framework-shaped markup is not the real Monaco/Ace/CodeMirror library. Universal framework compatibility and actual GUVI compatibility are UNVERIFIED.

## Executed checks

- pnpm type-check: PASS.
- pnpm lint: PASS, zero errors/warnings.
- pnpm test: 839 passed, 4 live-provider tests skipped; 76 passed files, 1 skipped suite. Includes controller integration with mocked CDP/handler, strict targets, live-identity failure paths, cancellation, freshness, mixed forms, no hidden retries, schema serialization with simulated Gemini HTTP, loop guards and exact readback. These are not native browser actions.
- Production build and ZIP: see final packaging verification; root manifest version 0.3.1.
- Native `pnpm autorun argument-controls --timeout 15`: attempted through the supported extension harness. Chromium aborted SIGABRT because the SUID sandbox helper is not configured correctly. Zero browser reports. An initial restricted-network attempt also failed localhost binding; retry with network access reached the browser launch. Managed extension installation policy is separately restrictive. No sandbox/policy bypass.
- Static source, Git history/diff, production and archive secret-pattern/integrity checks: see `release/ARGUMENT-FIX-VERIFICATION.json`. Heuristic scans do not establish absence of all possible personal information/secrets.

## Native acceptance checklist — ALL UNVERIFIED

Use an authorized unmanaged Chrome/Edge installation; load the Chrome ZIP unpacked, configure your own provider, retain Ask mode. Run `pnpm autorun argument-controls` for the local fixture; it is not GUVI acceptance.

1. Hint: observe/find the actual control, click fresh structured ref, verify revealed content and action receipt.
2. Java editor: identify actual framework/editable/frame, paste exact supplied multiline Java, read back exact content, confirm no duplicate insertion or hidden textarea substitution. If readback is unavailable, report unverified.
3. Run Code: click observed actual control, wait for real execution output; preserve actual errors/output. Fixture output is not an online judge result.
4. Submit: require the configured Ask/site approval or mandatory handover; cancel once to verify no submission, approve only an intended submission, inspect actual result. Never assume Accepted.
5. General: normal button/link/select/checkbox/input; navigation and tab scope; stale/unknown/cross-tab target refusal; Stop during a multi-step task; no action after cancellation, no unintended form submission, no repeated action after possible dispatch.

Capture sanitized target diagnostics/provider identity and real receipts. Do not export private code or login data. Definition of done requiring successful real GUVI/native actions is NOT established in this environment.

## Files and delivery

Modified implementation: src/agent/{tools,prompt,loop,guards}.ts; src/llm/stream.ts; src/extension/agent-session.ts; src/browser-control/{index.ts,protocol/results.ts,core/controller.ts,core/tools/text.ts,probe/source.ts}. New helper core/arguments.ts. New tests: target-arguments, target-wire, arguments, editor-readback. New fixture/check: argument-controls.html and src/background/checks/argument-controls.ts plus check registration. Packaging/version, legal inventory and docs updated; no new dependencies or UI redesign.

Local deliverables: Vistara-AI-Argument-Fix-Chrome.zip and Vistara-AI-Argument-Fix-Source.zip. Source excludes node_modules, .env, Git metadata, caches, logs, work and release folders. Git history preserved; no remote update authorized by this task.
