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
