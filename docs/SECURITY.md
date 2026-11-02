# Security and privacy

## Manifest baseline
`sidePanel` hosts the assistant; `storage` saves settings and ephemeral secrets; `activeTab` grants temporary user-invoked page access; `scripting` injects the packaged read-only reader. No history/cookies/tabs/debugger/downloads/alarms permission. No static content scripts and no default all-website access.
Optional hosts are only `https://generativelanguage.googleapis.com/*` and `https://api.groq.com/*`, requested by an explicit Settings connection gesture. They allow model discovery and HTTPS API calls. Revoking these in Chrome prevents new requests; abort the active response first. No unrelated site permissions or background browsing.

## Secrets
Session keys are default, trusted extension contexts only. Local keys are optional and require the persistence disclosure checkbox. Local storage is not a vault: malicious browser extensions, an OS compromise, or extension-origin debugging can expose keys. Do not use shared developer keys for public distribution. A public commercial version should instead use a secured backend with authenticated short-lived credentials, limits and abuse controls; that backend is not built or required here.
Key use for provider requests is worker-only. Settings temporarily holds the key the user types, transmits it to the worker, and clears the input after a successful save; it never reads back a stored key. No key returned in BOOT. Provider adapters use request headers, never URL query credentials. Content scripts never receive keys. History and error redaction cover configured keys and common recognizable secret patterns. Streaming withholds trailing fragments matching configured-key prefixes before UI events or checkpoints. This is conservative redaction, not a general sensitive-data detector. No telemetry, remote fonts, external executable code, eval, or shell tool.

## Cloud consent
Every provider needs separate explicit consent before chat. Page context is OFF by default per conversation and must be enabled explicitly. Page preview is local until a user sends context. Free-tier terms may allow product improvement use; remaining quota/free eligibility are unknown. Read https://ai.google.dev/gemini-api/terms and https://console.groq.com/docs/your-data . No silent provider switch; a conversation cannot be forwarded to another provider. Start a new conversation instead.

## Page safety
Only top-level authorized HTTP/HTTPS pages; Chrome pages, Web Store and PDF paths rejected. Scripts, styles, hidden/private/editable elements, common offscreen-hiding patterns and all form values are excluded, with finite traversal/output budgets. This is a DOM reader rather than pixel-level visibility analysis. All iframe content is omitted, including same-origin frames; open shadow DOM is supported, closed shadow roots and canvas are not. Redact recognizable secrets. No claim that arbitrary sensitive prose can be automatically detected: do not share confidential pages. Snapshot redaction cannot certify a confidential page safe for cloud processing. Snapshot URLs lose known sensitive query parameters, fragments and userinfo. Source citations additionally drop the whole query string. All snapshots delimited/escaped as untrusted data. These delimiters do not guarantee that a model will ignore every malicious instruction or produce an accurate summary. The deterministic boundary is no action registry in M1: a malicious page cannot induce an executable tool call, navigation, form submission or external export. Provider output renders as React text/safe Markdown, never raw HTML.

## Actions in later milestones
LOW/MEDIUM/HIGH policy from specification remains unchanged. HIGH requires fresh explicit approval; credentials/OTP/payment entry always refused. Not implemented yet. Do not mistake UI roadmap screens for functional automation.

## Deletion and suspension
IndexedDB stores local conversations only, with delete/clear controls. Settings/keys are extension-origin storage. An unfinished assistant draft recovers as interrupted on worker restart; no request or action automatically replays. Clear all local data deletes both history and settings/secrets. No backend copy is maintained by Vistara; provider retention is governed by provider terms.

## Verification boundary
The security checks include unit/controller tests, compiled DOM/UI fixture tests and a static build audit. They do not constitute a dynamic live-provider traffic audit or native Chrome permission audit: managed browser policy blocks loading this extension, and no real provider key was supplied. See [TEST_REPORT.md](TEST_REPORT.md) and [NATIVE_VERIFICATION.md](NATIVE_VERIFICATION.md).

Privileged RPC authenticates the extension ID and exact packaged popup/sidepanel URL; content-script senders cannot invoke the worker's key/settings/chat RPC. Asynchronous chat drafts are plain data messages. Retention is manual deletion in this stage, without automatic expiry.

## M2 security extension (current)
M1 consent, keys, reader and read-only Chat remain preserved. M2 is a separate explicit Task operation and supports Gemini only; optional Groq configuration/read-only Chat remain unchanged. No automatic provider or paid-model switching.

The user authorized M2 site access: optional HTTP/HTTPS host declarations were added, with no required tabs/history/cookies/debugger or all-site default permissions. UI requests only the exact pending origin in a user click. A previous browser host grant does not enroll a site/tab in a task. Engine checks task-local origins/tab IDs and Chrome permission before every tool, injection and observation. onRemoved interrupts tasks. Chrome host access may remain granted after task; revoke via extension Site access. Closing Tasks pauses before the next action.

All eleven tools use predefined schemas. No JS source/selectors or unrestricted scripts reach the model. Packaged actions.js only, isolated world. No credential, OTP, token, cookie, payment, username or file entry; recognized sensitive-looking text and navigation URL values refused. Visible controls/form structure omit input values; field labels also exclude textarea/select/editable descendants. Per-provider keys are redacted from task goals, observations, final reports, traces and previews, and never enter a tool call.

HIGH policy remains mandatory. Conservative defaults additionally approve field edits, ambiguous clicks and exact destinations because webpage input handlers may submit/change data. Receipts bind to target, site, arguments and visible form preview; one use, 30-second expiry, recheck on execution; never restore them after worker restart. Unknown/hidden app-managed payload is not extracted and no server success is inferred. Mutation retries never occur automatically after uncertain outcome; task interrupts for inspection. CAPTCHA/login detection hands over; protected pages/frames/security are respected. Emergency Stop aborts model and dynamic waits and prevents next dispatch, but cannot undo an operation already delivered to the page.

No M3 planner, saved workflows/recorder/schedules, voice or visual agent is introduced. M2 executes the requested bounded function-call feedback cycle, with maxSteps from Settings, bounded request budget, transient provider retries only, repeated-failure stop, persistent latest-task trace/checkpoint and interrupted recovery without replay.

Publication scope: latest explicit user authorization requires keeping smelld41rr/Vistara-AI-Agent PUBLIC and uploading sanitized M2 only after checks; earlier private-only request was superseded. No force push, unrelated-file deletion, deployment or Chrome Web Store publication. Source, history changes, artifacts/reports and ZIP contents undergo heuristic secret scans; no scanner proves absence of all possible secrets.

## M2.1 endpoint and capability boundary

Provider profiles are trusted UI configuration, never LLM-selected endpoints. Strict URL/protocol validation, HTTPS (explicit loopback HTTP exception), user-clicked exact-origin optional grants, header-only credentials and fetch redirect rejection apply to every adapter. Native Gemini/Anthropic and the explicit OpenAI-compatible adapter share cancellation, deadlines and bounded parsing. The LLM has no configuration tool, arbitrary JavaScript, headers, cookie or secret access.

Worker-owned compatibility diagnostics bind endpoint/model/key/options to text and safe no-op tool/result proof. UI cannot forge proof via profile saves or general settings saves. Listing/config flags alone cannot enable browser actions. Key changes/removal invalidate proof. Source config exports omit keys and proof; local/session stores remain TRUSTED_CONTEXTS. All dynamic/orphan credentials are redacted, not only legacy keys. Draft probes do not save keys; save writes restore old storage/settings on failure. Clear data also clears draft credentials, in-memory task state and cached diagnostic proofs.

M2 fresh approvals, credential-entry refusal, site/tab scoping, prompt-injection treatment, CAPTCHA handoff, cancellation, no replay and observational verification remain deterministic code controls. No new required manifest permission, remotely hosted code, dependency or service was added. Standard Chrome host permissions cover origins/hosts rather than individual API paths; requests themselves remain at the configured base. Redirect rejection is enforced before credentials can be sent to a redirect destination. Browser fetch can report this rejection as a network failure without revealing redirect details.

Do not confuse a past probe with permanent availability or free eligibility. No automatic billing, provider/model switch or live automated API use. Known limits and native checks are in the M2.1 reports.
