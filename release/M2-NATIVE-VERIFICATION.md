# M2 native Chrome acceptance — UNVERIFIED

2 November 2026. Native extension loading in this managed environment is BLOCKED by Chromium policy ExtensionInstallBlocklist=["*"]. The standard persistent Chromium unpacked-extension attempt did not load the service worker; no policy bypass attempted. See browser-results.json for the latest observed policy/browser version.

The user reports M0/M1 side-panel use, live Gemini response, page/repository summarization and exact selected-text reading manually verified in real Chrome. This is USER_REPORTED M1 evidence, not an M2 test run performed here.

## Required setup on an authorized unmanaged Chrome profile
1. Extract Vistara-AI-M2-Chrome.zip into a persistent folder. chrome://extensions → Developer mode → Load unpacked → select manifest.json's folder. Reload existing Vistara and page tabs after updating. Never bypass organization policies.
2. Confirm existing Chat, summarization, selection, provider consent, session-key storage, Stop, history and delete controls still work. M2 does not replace the read-only Chat reader.
3. Configure your own Gemini key and choose a model supporting function calling. Grant its API host, accept its cloud disclosure, save settings. Never post keys in chat or bug reports. Provider billing/free-tier eligibility is not guaranteed or automatically enabled.
4. Open Tasks. Enter a goal and explicitly enable this task's page-sharing authorization. Grant only the exact requested site origin using the in-panel button. Chrome's host grant can persist; task-local origin/tab scope is separately enforced. Revoke host grants in chrome://extensions → Vistara → Details → Site access.
5. Record task IDs, exact goal, URLs/tab IDs, trace statuses and relevant sanitized screenshots. Never include personal credentials, cookies or private content in evidence.

## Native acceptance matrix (all UNVERIFIED here)
| User command | Expected observation / evidence |
|---|---|
| Open github.com | Start on ordinary website with toolbar invocation. Approve initial site, then GitHub site if requested; review exact destination. Real tab reaches canonical https://github.com/ and URL/load evidence is recorded. |
| Open my GitHub profile. | Supply explicit public profile URL/username or start on your signed-in GitHub page; agent must not invent identity, log in, or read credentials. Approve destination; verify profile URL/header. |
| Click the Repositories tab. | Agent finds visible semantic label, navigates the actual link only after destination approval; verify URL/tab contents. |
| Find and open the WayHome repository. | Reuse public profile/task context or state public repo URL explicitly. Find actual link; if absent report missing rather than fabricate; approve URL and verify repository header/URL. |
| Scroll down to the README. | Bounded actual vertical scroll; verify viewport position and README presence. Repeated ineffective scrolling stops at limits. |
| Go back to the previous page. | Uses only task-recorded navigation history for this tab. Across tasks, prior history is retained only if current URL matches the last recorded task URL. Manual unrelated navigation resets that history. Approve exact previous URL. Unknown history is refused. |
| Find a search field and type a test query without submitting. | Include exact text in goal, e.g. type test query without submitting. Approve field edit preview; observe read-back, no Enter/submit tool. Verify no submit/network operation was unintentionally triggered by site input handlers. |
| Open the target in a new tab and switch to it. | Approve URL; actual new task-owned tab is created. Switch only to initial or task-owned scoped IDs; unrelated existing tabs must be refused. |
| Stop the agent during a multi-step action. | Press Stop while waiting/model call/dynamic wait. No further tools dispatch. Already-dispatched website actions cannot be undone; uncertain outcomes stop and require manual inspection. |

## Security/native regression checklist — UNVERIFIED here
- Reject a form-submit/delete/send/pay approval: no click executes. Approve once: revalidate live target/data; if page/form changed, request approval again. Receipts expire after 30 seconds and are never restored/replayed after worker restart.
- Never type/read password, OTP, token, cookie, payment or username credentials. Form operations containing sensitive values must hand over. File uploads, Enter submission, arbitrary JS and shell tools do not exist.
- CAPTCHA/login challenge: manual handoff and stop. Protected Chrome/Web Store/PDF pages, inaccessible frames and closed shadow DOM: report restriction, never bypass.
- Revoke an allowed host while running: interrupt task. New domain/tab outside task scope: ask/deny before reading/acting. Observe provider/domain boundaries even if browser has an old persistent grant.
- Pause during a model call: no next browser action until Resume. Close/navigate away from Tasks: pause before the next action. Stop remains available during pending grant/approval.
- Reload service worker during a run: task becomes interrupted, pending approvals removed, no action replay. Inspect current page before new task.
- Confirm no website breakage, duplicate submissions or unsafe retries. DOM interaction can trigger website handlers; field edits therefore also require explicit preview/approval.

Fixture-browser tests in M2-TEST-REPORT are NOT substitutes for this native matrix. Live Gemini function calling from the installed extension is UNVERIFIED; the automated combined test substitutes Gemini HTTP responses and Chrome API transport while operating on real local browser DOM.
