# User guide

Chat with a model selected in Settings. No mandatory registration, paid backend, local model or subscription. Your provider may impose billing/quota/region restrictions; free usage is never guaranteed.

Current page context starts OFF. A local preview shows what can be shared; preview itself does not send anything to AI. Enable context and send only when you approve sharing that page with your selected provider. Forms expose structure, never input values. Selection is limited and excludes private controls. Never share credentials or confidential prose.

Stop aborts a streamed request. Regenerate resends the previous user request and may consume provider quota; provider behavior is nondeterministic. New conversation clears the in-memory page toggle. History can be reopened, exported locally in redacted JSON, or deleted. Clear all local data in Settings removes keys/settings/history after confirmation.

Provider switch requires a new conversation and consent to that provider. Model availability is discovered using your own account. 401: replace key. 403: check region/key/project restrictions. 429/quota: request stops, wait/check dashboard; no automatic retry or billing/provider switch. Connection test verifies model discovery only, not generation/free allowance. Remaining quota is unavailable unless provider supplies it.

Agent Tasks, Workflows and Extract Data are roadmap screens marked Not built yet. Browser click/type/navigation, autonomous tasks and schedules are not available in this stage.
