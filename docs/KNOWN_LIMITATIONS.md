# M2.1 additional limitations

- All live provider checks are UNVERIFIED. Native Chrome is BLOCKED by managed extension installation policy; fixtures use simulated Chrome/API transport. See M2.1-NATIVE-VERIFICATION.md.
- Catalog protocols are implemented and mock-tested, not guarantees for every model/account. Only OpenAI-compatible Chat Completions with Bearer auth is supported for custom profiles. No Responses API, OAuth, arbitrary headers/JSON, custom protocols, SDK plugins or config import.
- Model-list success is not text/stream/tool success. Native Gemini/Anthropic pagination is bounded; compatible provider pagination beyond array/data responses is not implemented. Manual model IDs and independent tests remain available. Family-name filtering cannot identify every non-chat model.
- Some reasoning/tool models require different token/temperature settings. Toggle the supported options and retest. Tool probes use a small output budget; large reasoning requirements may fail conservatively.
- Profile evidence is local and configuration-bound, not a permanent capability certificate. Per-request failures still stop safely. Editing any request setting invalidates proof. Existing M2 profiles must retest before Tasks; history/keys remain intact.
- Session keys disappear on browser close by design. Local persistence is opt-in and not encrypted as a server vault. Renaming a saved ID is unsupported; make another profile instead. Deleting default profiles requires choosing alternatives first.
- Usage shows actual supplied diagnostic/latest request tokens and existing Chat usage; no unified account usage ledger, quota balances or invented prices. Listing is not billed-generation usage in the displayed counter. No automatic free-tier eligibility inference.
- Redirects are rejected by fetch; Chrome may surface them as network failure because fetch hides the redirect. Explicit local HTTP must be loopback and still needs native permission/CORS verification.
- Optional same-profile fallback requires an explicit flag, matching passing text diagnostic, no emitted text and parser/unsupported-capability failure. It never switches profiles or bypasses quota/auth/billing/429/503. Disabling streaming is an explicit separate option.
- No M3 or later features. M2 engine limitations remain below.

---

# Known limitations — M2

- Native M2 Chrome extension/API acceptance is UNVERIFIED: managed policy blocks unpacked loading. User-reported manual M1 verification is recorded separately; do not infer M2 passes. M2 native checklist includes all nine requested GitHub/WayHome commands.
- Live Gemini function calling from installed M2 was not executed here (no user key). Automated combined fixture test uses real TaskManager, REST adapter, browser coordinator/content bundle and actual DOM, but scripted Gemini HTTP and Chrome transport.
- M2.1 supersedes the Gemini-only restriction below: Tasks use the explicitly selected profile after matching successful text and no-op tool roundtrip tests; no silent provider/billing switch.
- No generalized M3 planning, saved workflows, recorder, scheduling, extraction studio or voice/vision. Latest task trace/checkpoint only; no M6 task-history library.
- Only standard visible DOM/open shadow controls; no closed shadow roots, iframe content, canvas, browser/Web Store/PDF protected pages. Custom dropdowns/contenteditable entry/Enter/file upload/credential tools not supported.
- Inputs with credential/payment/OTP/username semantics and sensitive-looking text refused; heuristics may conservatively refuse benign fields. Do not share confidential prose: no automatic DLP guarantee.
- Field edits may trigger site handlers, so all edits require preview/approval. Sensitive/ambiguous clicks and exact destinations also ask. Visible form preview cannot expose hidden/page-managed payload; no server-side success claimed.
- Verification checks actual DOM/URL/value/scroll evidence. A mutation is not proof of semantic/server success; verify_action exposes current observation plus historical evidence and does not assert final-goal completion. Unknown mutation outcome stops for manual inspection.
- Stop prevents further dispatch and aborts waits/model requests but cannot undo an already-dispatched site operation. Pause/closing Tasks gates the next action; an in-flight action may finish. Worker suspension marks interrupted, never replays. Native port/lifecycle behavior still requires manual acceptance.
- Back only through task-recorded navigation, including prior task history for same tab when current URL matches; manual/unrelated navigation resets it. Task switching is limited to initial/task-owned tabs, max eight; unrelated existing tabs cannot be enrolled through the model.
- Snapshot traversal/content, 10-second navigation/wait limits, 12-second content reply, model request timeout, step/request limits and repeated-failure stop may interrupt slow sites. Token usage/free quota not invented; context budget is characters.
- Chrome host grants can persist until revoked in extension Site access; task-local approval is separate. Optional HTTP/HTTPS declarations grant no access by default.
- Session-default keys/local opt-in; local storage is not a vault. No production API keys, browser profiles or local caches are shipped. Static secret scans are heuristic, not proof of all sensitive-data absence.
