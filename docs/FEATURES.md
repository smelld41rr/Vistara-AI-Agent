# Current features — M2 (0.2.0)

M0/M1 preserved: read-only Chat, Gemini/Groq BYOK, runtime model discovery, per-provider consent, page context OFF, separate M1 page reader, selection, streams/cancel, IndexedDB conversations, local deletion/export, themes/font/density.

M2: eleven schema-validated browser tools, packaged actions.js, task-scoped sites/tabs, exact-origin optional grants, semantic controls and stale revalidation, actual DOM edits/clicks/native dropdowns/scroll, URL/new-tab/switch/back operations, dynamic waits, observable evidence, Gemini supported function-call/functionResponse feedback.

Tasks: separate explicit authorization to share relevant observations; current goal/site/tab/action, actual trace/results, permission and sensitive-action cards, 30-second one-use approvals, pause/resume/stop, uncertain-outcome interruption and no automatic replay, latest-task local checkpoint and per-task execution history. Panel close pauses before next action. Cross-task Back uses only task-recorded history for the same tab if its current URL still matches.

Not M3: no generalized planner/workflow system, saved workflows/recorder, schedule service, extraction/comparison studio or vision/voice. Only current/latest task trace, not multi-task history UI. Native M2/live Gemini tool calling remain unverified; tests distinguish real DOM fixture evidence from native Chrome.
