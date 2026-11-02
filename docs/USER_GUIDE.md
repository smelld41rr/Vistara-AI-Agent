# User guide

Chat with a model selected in Settings. No mandatory registration, paid backend, local model or subscription. Your provider may impose billing/quota/region restrictions; free usage is never guaranteed.

Current page context starts OFF. A local preview shows what can be shared; preview itself does not send anything to AI. Enable context and send only when you approve sharing that page with your selected provider. Forms expose structure, never input values. Selection is limited and excludes private controls. Never share credentials or confidential prose.

Stop aborts a streamed request. Regenerate resends the previous user request and may consume provider quota; provider behavior is nondeterministic. New conversation clears the in-memory page toggle. History can be reopened, exported locally in redacted JSON, or deleted. Clear all local data in Settings removes keys/settings/history after confirmation.

Provider switch requires a new conversation and consent to that provider. Model availability is discovered using your own account. 401: replace key. 403: check region/key/project restrictions. 429/quota: request stops, wait/check dashboard; no automatic retry or billing/provider switch. Connection test verifies model discovery only, not generation/free allowance. Remaining quota is unavailable unless provider supplies it.

Agent Tasks, Workflows and Extract Data are roadmap screens marked Not built yet. Browser click/type/navigation, autonomous tasks and schedules are not available in this stage.

## M2 Tasks (current)
The earlier read-only-stage note describes the prior milestone; Tasks is now implemented. Workflows/Extract Data remain pending. Configure Gemini, open Tasks, enter a goal containing exact text/URLs you want, check explicit page-sharing authorization and Start. Approve the current website for this task (even if Chrome already holds its host grant). Review exact destination/edit/sensitive-action cards and Approve once or Reject and stop. A site grant is not an approval to submit/delete/send. Stop is always available until terminal state. Pause/closing Tasks prevents the next action; inspect any already-dispatched result. Worker restart interrupts without replay. Unknown mutation outcomes require manual inspection. Trace statuses report actual evidence/uncertainty, not fabricated percentages. Only latest task history is retained; saved workflow/scheduling/multi-task history are not built.
