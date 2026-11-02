# Known limitations

This is a staged M0/M1 read-only build, not the completed M0–M8 browser agent.
- Native extension loading is subject to the managed Chromium policy; see the attempt and manual Windows checklist in [NATIVE_VERIFICATION.md](NATIVE_VERIFICATION.md). Windows not tested here.
- Live Gemini/Groq generation not run: no user key supplied. REST adapters are tested with scripted responses only.
- Model metadata does not reliably expose tools/images/structured output/free eligibility; the provider contract records unsupported metadata as unknown. The model picker does not certify those capabilities or free-tier eligibility. Models are user-selected; no hardcoded default.
- No action engine/autonomous browser mutation, multi-tab comparison, extraction studio, graph workflows, recorder, alarms, vision or voice.
- Reader does not support protected Chrome/Web Store/PDF viewer pages, any iframe content (including same-origin frames), closed shadow DOM or canvas data. Dynamic-page snapshots may become stale; read again.
- No input values are read. Recognizable secrets are redacted but sensitive prose cannot be detected reliably.
- Context budget is in characters, not a measured token count. History and page serialization are bounded separately; the current user prompt and system instruction add to the total. Truncated snapshot serialization is source data, not guaranteed to remain a complete JSON document. Provider token metadata shown only when reported; remaining quota unknown.
- Background worker can suspend; drafts checkpoint and recover as interrupted, never replay automatically. A live worker suspension test is blocked if native extension installation is blocked.
- Basic safe Markdown formatting; complex GFM tables/math not implemented.
- No paid backend or secret vault. Local-persisted keys carry client-side risks; session-only recommended.

- Native activeTab, side-panel user gestures, trusted-context Chrome storage access and a live worker restart remain unverified here. Mocked Chrome APIs and real IndexedDB/browser fixtures do not establish those privileged behaviors.
- Provider permission revocation is checked before new requests. This build does not monitor a mid-request permission removal to guarantee immediate abort; use Stop before revoking provider access.
- Prompt-injection delimiters and escaped rendering do not guarantee model factual accuracy or instruction-following. The deterministic M1 boundary is the absence of executable browser/action/export tools.
- The entire page read is not cancellable. The background applies a 10-second reply timeout after injection; the reader performs a bounded synchronous DOM traversal.
- History is retained locally until deleted; configurable retention and automatic expiry are not implemented. Basic conversation JSON export exists, but structured page-data CSV/JSON exports and task/workflow logs are pending.
