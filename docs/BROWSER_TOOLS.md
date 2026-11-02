# Browser tools — M2

Registry: src/features/automation/contracts.ts. All eleven tools have Zod input schemas; ResultSchema validates verified/unverified/failed/approval_required, evidence, semantic elements and approval cards. Definitions are converted to JSON schemas for existing Gemini function calling. No arbitrary JS, CSS selector, eval, Function, shell, cookies or credential tools exist.

| Tool | Behavior and verification | Security |
|---|---|---|
| open_url | tabs.update to canonical URL; bounded load-state/URL check | Exact task origin + Chrome host grant, fresh URL approval; sensitive URL values refused |
| open_tab | tabs.create; URL/load check; max 8 task tabs | Same scope/approval; records task-owned ID |
| switch_tab | tabs.update(active); read-back active state | Only initial/task-owned tab IDs with granted origin |
| find_element | Visible role/accessible label/semantic metadata; temporary IDs | Finite DOM traversal, open shadow roots; never returns control values |
| click_element | Revalidates element/signature, highlights and clicks; observes real mutations/navigation | Sensitive/ambiguous clicks require fresh confirmation. Anchors route to background URL approval, never unchecked page click |
| type_text | Native input/textarea setter, input/change events, read-back comparison | User-supplied verbatim text only; credential/payment/OTP/username/file fields refused; exact edit approval |
| scroll_page | Bounded x/y pixels; actual position difference | No AI JS, empty movement stays unverified |
| select_option | Native HTML select exact option; read-back | Custom dropdowns unsupported; sensitive fields refused, exact edit approval |
| go_back | Actual tabs.goBack to known task-recorded previous URL; verify destination | No arbitrary browsing history access. Same-tab task history only; explicit URL approval; manual URL changes reset stored chain |
| wait_for_element | Bounded semantic wait (max 10 seconds), cancellation | No selector execution, max 12,000 nodes/500 controls traversal |
| verify_action | Current observation + historical evidence | Does not assert goal/server-side completion from historical mutation; reports unverified when no independent invariant is established |

Packaged actions.js lives in isolated content world and accepts only validated worker messages from the same extension. IDs remain document-bound and revalidate signature/connectivity before use; after DOM replacement they fail stale_element. M1 reader.js stays separate and unchanged.

Background send/reply timeout 12 seconds, navigation wait 10 seconds, provider timeout from validated Settings, model retries bounded (never automatic 429 retry), step/request limits and repeated failure stop. A mutation with uncertain outcome interrupts the task instead of automatic replay. Cancellation stops further dispatch/waits, but cannot undo an already-delivered browser/page/network action. Pause gates the next action; an in-flight action may finish.

Per-site grant UI calls permissions.request directly in a click gesture for the pending origin; optional manifest patterns do not grant default all-site access. Background rechecks Chrome grants, task-origin set and task-tab IDs. Provider keys stay in the worker; content scripts receive no keys. Fresh one-use action receipts are bound to site, current element signature, arguments and visible form preview, expire after 30 seconds, and are invalidated by changes. Hidden/page-managed submission payload is not extracted; server-side processing is never claimed verified.

Tests: unit/automation.test.ts (DOM + Chrome mocks), integration/agent.test.ts (task manager with scripted collaborators), scripts/m2-browser-test.mjs (actual DOM/navigation/tabs in Chromium with simulated Chrome transport, actual manager+Gemini REST adapter with scripted HTTP), plus M0/M1 regressions. Native Chrome M2 tests remain UNVERIFIED due managed policy; see M2-NATIVE-VERIFICATION.md.
