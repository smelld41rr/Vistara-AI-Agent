# Target argument fix plan

Confirmed code path: model definitions reuse a four-way strict target union including selector/point variants not enabled for agent sessions. SDK jsonSchema without a validate hook forwards model input; Session.call rejects malformed targets at safeParse before resolving a tab/handler. This reproduces the exact reported message; actual GUVI raw payload/provider/editor remain unknown.

Keep public controller parsing strict. Add an explicit agent-adapter flag for unambiguous bare-ref target repair only. Canonical args must pass original schema, current session/tab observation, live document/identity/context revalidation under the existing tab lock before the handler, then all normal actionability/permission/approval gates again. Never repair nested id/selector/point targets. Narrow the model-facing target union to actual supported ref/semantic objects; add concrete examples. Add shape-only diagnostics and an early repeated-invalid guard. Inspect existing CDP text focus/insert/readback; support visible native/contenteditable editor targets and report hidden/internal framework limitations without guessing.

Run provider serialization, controller/refs, loop guards and text regressions plus full pnpm checks/build/ZIP. Native/actual GUVI checks remain distinct and may be blocked by known sandbox/policy. No GitHub push.
