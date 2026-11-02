# Architecture

Separate WXT MV3 extension in /workspace/vistara-ai; preserve Theme World.
React sidepanel → Zod request envelope → background controller → providers or on-demand page reader. Content scripts never receive keys. Provider HTTP fetches execute only in the worker with session keys. Keys stay in chrome.storage.session by default; restrict local/session to TRUSTED_CONTEXTS. Optional local key storage requires explicit UI disclosure.

Native IndexedDB stores conversations. Local Chrome storage stores validated settings. On-demand unlisted content bundle: no static all-sites injection. Initial permissions: sidePanel, storage, activeTab, scripting; optional provider-only hosts for external AI, requested by user gesture before connection. No website-wide host access and no remote executable code.

M0/M1 are read-only: no clicking, form filling or autonomous mutation. Later tools, agent, workflows and alarms are gated by native M0/M1 verification. UI clearly marks them Not built yet.

Provider-neutral contract uses model capability metadata, streamed text, structured outputs and explicit tool-result messages. Model capability unknown is not treated as supported. All page data is delimited as untrusted. Streaming uses task IDs, local-only drafts and background event messages; cancellation aborts fetch. Service-worker restart interrupts a draft and never replays requests.

## M2 additions
Task UI → validated AGENT_* RPC → TaskManager → scoped BrowserEngine → packaged actions.js/DOMTools. Gemini calls only registry-listed tools via existing Provider.generate; results are validated then fed back as tool-role functionResponse. Origin grant UI uses Chrome permissions.request directly in click handler; task resumes only after background permission recheck. Task checkpoints in trusted chrome.storage.local become interrupted after worker restart. Pending approval receipts are one-use and never restored across restart. Default Chat remains read-only and page context remains OFF. M2 UI task-run permission is a separate explicit opt-in.

M2 final details: read-only Chat remains unchanged. Tasks are a separate bounded tool-feedback runner explicitly requested in M2, not M3 generalized planning. One-use exact-state approvals expire after 30 seconds. Current task history includes only verified/task-recorded URLs, never arbitrary browser history. Uncertain mutation outcomes interrupt without replay. Browser-only content highlighting uses Web Animations without mutating page style attributes.

## M2.1 provider hub design (before implementation)
profiles.ts: versioned data/catalog/URL validation and migrations. Provider adapters: shared existing wire types plus native Anthropic, shared OpenAI-compatible transport and secure configured endpoints. hub controller: trusted draft diagnostics, key-bound compatibility and profile save/delete/default transactions; never trust UI-supplied readiness. UI ProviderHub: searchable catalog, multiple profiles/edit/diagnostics, separate defaults, endpoint consent and per-origin user-gesture grants. Existing Settings appearance/local data controls remain.

Agent and Chat resolve a profile once per run; no silent cross-profile transfer. Tasks use generateWithTools behind the same contract and require diagnostic proof. Persisted conversations retain old provider IDs; custom profiles use unique local IDs. Migration is nondestructive and idempotent. All keys are redacted using the complete configured-profile key set, including renamed/deleted-profile handling.

M2.1 implementation: see PROVIDER_ARCHITECTURE.md for the final profile/adapter/worker boundaries and migration; PROVIDER_COMPATIBILITY.md for documented endpoint protocols.
