# Vistara AI — M2 test report (0.2.0)

Date: 2 November 2026. Scope: the user's eleven-tool M2 browser automation engine, Gemini function-call feedback and functional Tasks UI. Existing M0/M1 preserved. M3/generalized planning, workflows, scheduling, deployment and store publication NOT STARTED.

## Actual final results
| Command | Result | Category |
|---|---|---|
| npm run build | EXIT 0; production MV3 build, 15 files, 751,083 bytes | Build |
| npm run typecheck | EXIT 0 | Strict TypeScript |
| npm run lint | EXIT 0 | ESLint |
| npm test | EXIT 0; 95 tests / 8 files | Unit/integration (HTTP/Chrome collaborators mocked where applicable) |
| npm run test:e2e | EXIT 0; 18 checks, zero console/page errors | Existing M0/M1 compiled UI/reader/real IndexedDB fixture regressions; Chrome/backend simulated |
| npm run test:m2 | EXIT 0; 15 checks, zero page errors | Actual local Chromium DOM/navigation/tabs, simulated Chrome transport; scripted Gemini HTTP |
| node scripts/audit.mjs | PASS | Exact required permission baseline; optional-only sites; no static host grants/content scripts; CSP/assets; no eval/Function/remote HTML scripts or credential canaries |
| node scripts/security-scan.mjs | PASS, zero findings | Source/reports, all available local Git commit diffs and pending changes; heuristic key/token/private-key/credential-filename checks |

Raw machine results: docs/browser-results.json, m2-browser-results.json and m2-security-results.json. Temporary full build/type/lint/unit logs are under work/ and excluded from artifacts. The final gate's observed exits were build=0/typecheck=0/lint=0/test=0.

## Unit/integration coverage
The previous 66 tests remain. M2 adds 19 DOM/coordinator unit cases and 10 task-manager integrations (95 total): all eleven declarations/argument schemas, semantic find and field-value exclusions, real DOM field edit/read-back, submit and sensitive-field refusal, exact changed-state approvals, native-select option, stale IDs, observable/inert clicks, dynamic wait/timeout/cancel, shadow controls, origin/tab scope, URL/new-tab/switch/back checks, retained task-only Back history and manual-navigation reset.

Task integrations verify independent task/provider consent, declarations/function-result feedback, untrusted source delimiters, rejection preventing action, one-use approval, 30-second expiry, pause/resume gates, cancellation of in-flight provider work, step/request bounds, repeated failures, unknown/malformed tool refusal, provider/quota stop, CAPTCHA handoff, permission revocation and interrupted checkpoints without replay. These integrations substitute Chrome/coordinator/provider collaborators; they are not native extension tests.

## Actual DOM fixture evidence (15 checks)
The production actions.js bundle and compiled BrowserEngine operate on actual local Chromium pages. Chrome APIs are bridged to Playwright tab navigation; therefore navigation, tabs, scrolling, values, clicks and form-event counts are real browser observations, but Chrome extension privileges are not verified. Fixtures cover all eleven tools, permission boundaries, stale elements, native dropdowns, shadow controls, credential refusal, no unapproved submission, dynamic cancellation, safe observations and responsive Task UI.

One combined test uses the actual TaskManager, Gemini REST adapter, registry, BrowserEngine and packaged content script. Only Gemini HTTP responses and Chrome transport/storage are simulated: scripted functionCall finds the real search field, a later call proposes type_text, the real approval gate pauses before editing, user approval allows actual DOM typing/read-back without submission, and actual functionResponse feedback is checked in the next Gemini wire request. This is not a live Gemini-model test.

Compiled Task UI tests execute start, exact-origin grant, approve, pause/resume/stop and execution-history rendering against scripted RPC. UI sharing defaults OFF, no fake percentages, 320/400/480 widths pass. Screenshot screenshots/m2-task-fixture.png is a real Chromium render of compiled UI with scripted data, NOT native Chrome extension evidence.

## Native Chrome: UNVERIFIED / environment BLOCKED
Fresh standard unpacked extension launch in persistent managed Chromium did not load the production worker. Observed ExtensionInstallBlocklist=["*"]. Policy was not changed or bypassed. The nine GitHub/WayHome commands and native privilege/lifecycle tests are UNVERIFIED; see M2-NATIVE-VERIFICATION.md for every command, expected outcome and evidence checklist. No actual live-website automation test was reported as passing.

User-reported M0/M1 manual Chrome/Gemini/summarization/selected-text success is recorded as USER_REPORTED evidence; it is not a new M2 native acceptance pass by this environment. Live M2 Gemini generation/tool calling was NOT RUN because no user key was supplied here.

## Security and honest limitations
No arbitrary AI JS/selectors/eval/Function/shell/cookie tools. Session-default keys and per-provider consent preserved. M2 adds optional-only HTTP/HTTPS declarations, requested as exact origins in UI; required permissions remain sidePanel/storage/activeTab/scripting. Every browser action checks task-local tabs/sites plus Chrome permission, stale target/signature and code-enforced approval/credential rules. Closing Tasks pauses future dispatch, revocation interrupts, Stop aborts waits/model work; already-dispatched operations cannot be undone. Uncertain mutation outcomes interrupt rather than replay. Historical DOM mutation evidence is not proof of server-side success; verify_action does not invent goal completion.

Form preview shows visible non-sensitive fields; hidden/page-managed payload is not extracted. Custom dropdowns/contenteditable/iframes/closed shadow/canvas/Chrome/Web Store/PDF protected content unsupported. Back is limited to recorded task navigation. Only latest task checkpoint/trace, not M6 multi-task history. Static secret scanning is heuristic, not a proof of every possible secret's absence.

## Failures corrected during development
An early M2 fixture cancellation assertion attached its rejection handler too late; the harness was corrected, not counted as a pass. A combined-test async polling helper returned before the manager reached approval; replaced with bounded awaited state polling. ESLint found unqualified fixture globals; corrected. Final runs above passed after these corrections. Approval/no-replay/privacy review additionally hardened field-label exclusions, non-mutating highlighting, 30-second receipts and retained task-only navigation history, with regression tests.

## Release artifacts
Vistara-AI-M2-Chrome.zip and Vistara-AI-M2-Source.zip are generated with node scripts/package.mjs --m2 after the successful production build. CRC integrity, root manifest/version/assets, forbidden path exclusions, archive content credential-pattern scans and SHA256 are recorded in release/archive-verification-M2.json and SHA256SUMS-M2.txt. No .env, credentials, caches, node_modules, personal browser data or .git is included. Earlier M0/M1 ZIPs retained unchanged. GitHub upload uses an additive tree and non-force expected-head update to preserve unrelated files; public visibility is explicitly user-authorized.
