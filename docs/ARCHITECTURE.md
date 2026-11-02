# Architecture

Separate WXT MV3 extension in /workspace/vistara-ai; preserve Theme World.
React sidepanel → Zod request envelope → background controller → providers or on-demand page reader. Content scripts never receive keys. Provider HTTP fetches execute only in the worker with session keys. Keys stay in chrome.storage.session by default; restrict local/session to TRUSTED_CONTEXTS. Optional local key storage requires explicit UI disclosure.

Native IndexedDB stores conversations. Local Chrome storage stores validated settings. On-demand unlisted content bundle: no static all-sites injection. Initial permissions: sidePanel, storage, activeTab, scripting; optional provider-only hosts for external AI, requested by user gesture before connection. No website-wide host access and no remote executable code.

M0/M1 are read-only: no clicking, form filling or autonomous mutation. Later tools, agent, workflows and alarms are gated by native M0/M1 verification. UI clearly marks them Not built yet.

Provider-neutral contract uses model capability metadata, streamed text, structured outputs and explicit tool-result messages. Model capability unknown is not treated as supported. All page data is delimited as untrusted. Streaming uses task IDs, local-only drafts and background event messages; cancellation aborts fetch. Service-worker restart interrupts a draft and never replays requests.
