# Current update — M2, 2 November 2026

User reports real-Chrome M1 sidebar, live Gemini, page/repository summary and exact selection verified. This is USER_REPORTED, separate from environment runs. M2 implemented; fixture/unit/integration verification is recorded in M2-TEST-REPORT.md. Native M2 remains UNVERIFIED/BLOCKED by managed install policy. M3 explicitly NOT STARTED. Public GitHub sanitized M2 upload explicitly authorized (latest user instruction supersedes private request).

## M2 capability status

| Capability | Status | Evidence |
|---|---|---|
| Eleven tool schemas/registry and Gemini definitions | DONE_VERIFIED | Unit plus provider/manager integrations |
| Actual DOM find/click/type/select/scroll/wait/verification | DONE_VERIFIED | Real Chromium local fixtures, privilege transport simulated |
| URL/tab/back scope and observable checks | DONE_VERIFIED | Chrome mocks + actual fixture tabs/navigation; no native claim |
| Task consent, exact origins/tabs, fresh approvals, credential refusal | DONE_VERIFIED | Unit/integration/security/fixture tests |
| Gemini functionCall/functionResponse feedback | DONE_VERIFIED | Scripted HTTP through actual REST adapter/manager/DOM; live M2 unverified |
| Goal/site/tab/action/trace/results and grant/approve/pause/resume/stop UI | DONE_VERIFIED | Compiled production UI fixture tests |
| Native Chrome M2 and live function calling | BLOCKED | Managed policy; all nine manual checks UNVERIFIED |
| M3 general planner, M4+ studio/workflows/schedules | PENDING | Not started |

Next native acceptance: docs/M2-NATIVE-VERIFICATION.md. No administrator-policy workaround. Earlier M0/M1 report below is historical and superseded for current capability inventory; its 66 baseline tests remain regressions.

---

# Progress — 2026-11-02

Documents read in full: 11-page PDF and 280-line master specification; trace in SPEC_REVIEW.md. Existing /workspace/Vistara Theme World preserved; no push, publish or deployment.

## Milestone status
| Milestone | Status | Evidence / remaining gate |
|---|---|---|
| M0 Foundation | BLOCKED (native gate only) | Build/typecheck/lint, schema/messaging/storage tests and compiled sidebar verified. Native unpacked loading blocked by managed ExtensionInstallBlocklist=["*"]. |
| M1 Read-only chat/page reader | BLOCKED (native/live gates) | Independent code implemented and tested with real DOM/IndexedDB and scripted provider HTTP. Native UI/user-gesture/API boundaries require manual Chrome verification. Live generation NOT RUN: no key. |
| M2 Browser action engine | PENDING | Must follow verified M1 gate; click/type/navigation/approval tools not implemented. |
| M3 Autonomous agent | PENDING | Depends on M2. |
| M4 Research/extraction | PENDING | Depends on agent/action gates. |
| M5 Workflow Studio/recorder | PENDING | No graph/recorder pretend UI. |
| M6 Scheduling/task history | PENDING | Conversation history exists; task runs/alarms do not. |
| M7 Advanced hardening | PENDING | Initial themes/accessibility present; full gate not attempted. |
| M8 Full release audit | PENDING | Current read-only build audit/package checks performed separately; full agent audit not claimed. |

## Capabilities
| Capability | Status | Verification category |
|---|---|---|
| WXT MV3 build, strict TypeScript, ESLint, pinned dependencies | DONE_VERIFIED | Executed production build and static checks |
| Minimal permissions, on-demand reader, packaged-only RPC caller | DONE_VERIFIED | Manifest audit/unit tests; native privileged API behavior still unverified |
| Responsive React shell, honest pending screens, original icons/tokens | DONE_VERIFIED | Compiled React in Chromium with mocked Chrome APIs, 320/400/480 px |
| Gemini/Groq runtime discovery and HTTP adapters | DONE_VERIFIED | Scripted HTTP unit tests; no live API claim |
| Provider streaming, cancellation, timeout, bounded retries, 429 stop | DONE_VERIFIED | Unit and actual-controller mock integrations |
| Typed tool-calling/structured-output provider contract | DONE_VERIFIED | Unit tests only; no executable action registry |
| Session-default keys/local opt-in and trusted storage initialization | DONE_VERIFIED | Chrome-storage mocks; native access-level enforcement not tested |
| Consent/provider isolation, no-page default | DONE_VERIFIED | Actual controller with simulated Chrome, plus compiled UI tests |
| Visible page text, headings, links, form metadata and selected text | DONE_VERIFIED | jsdom plus real Chromium compiled-reader fixture checks |
| Hidden/editable/input value exclusions and untrusted delimiters | DONE_VERIFIED | Reader/privacy and controller integration tests |
| History IndexedDB persistence, deletion and draft recovery | DONE_VERIFIED | Real IndexedDB, second independent connection; privileged Chrome storage mocked |
| History export/copy/new/regenerate/stop controls | DONE_VERIFIED | Compiled UI with scripted background substitute |
| Theme/density/font and visible keyboard focus | DONE_VERIFIED | Compiled UI fixture checks; no screen-reader certification |
| Split-key stream protection, startup cancellation, storage-failure terminal events | DONE_VERIFIED | Targeted controller/security regression tests |
| Current-stage production/source archives | DONE_VERIFIED | ZIP integrity, root manifest, exclusions, credential-pattern scan and SHA256; not native installation |
| Downloadable attachment export | BLOCKED | Configured output root absent/read-only; verified ZIPs in shared workspace release/; see DELIVERY.md |
| Real Chrome side-panel open/activeTab privilege behavior | BLOCKED | Administrative extension install policy; manual checklist provided |
| Native service-worker suspension/recovery | BLOCKED | Same policy; pure persistence recovery tested separately |
| Actual Gemini/Groq generation and account free-tier eligibility | DONE_UNVERIFIED | NOT RUN — no user key supplied; no hardcoded default or guaranteed free quota |
| Dynamic site automation, browser mutation, full action risk approvals | PENDING | M2/M3 |
| Multi-tab comparison, schema extraction studio and CSV data exports | PENDING | M4; conversation JSON export is a different feature |
| Workflow graph/variables/import/export/recorder | PENDING | M5 |
| Schedules/alarms/missed-run policy/task traces | PENDING | M6 |
| Voice and visual page reasoning | PENDING | Optional, not requested |

## Next unfinished item
Run docs/NATIVE_VERIFICATION.md on authorized unmanaged Chrome for M0/M1, including a user-owned API key locally (never post it in chat). Record actual results and resolve any issues. PDF Session 2 page 6 requires previous verification before M2; do not start M2 while native gate is unresolved. Environment blocker does not imply full-agent completion.
