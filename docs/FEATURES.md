# Feature inventory — milestone 0/1 build

Foundation: WXT MV3, React, TypeScript strict, Tailwind tokens, original local icons, typed RPC, Chrome storage plus IndexedDB.
Read-only assistant: Gemini/Groq BYOK adapters, runtime model lists, explicit provider/model, cloud consent, streamed conversation, stop, regenerate by resending, safe rendering, copy, searchable local conversation history, redacted JSON history export and deletion, provider usage metadata where present. “Ask again” appends a new request; it does not replace the earlier answer.
Page reader: actual visible text, headings, links, form structure without values, selection, restricted-page handling, bounded traversal. Current-page context defaults OFF.
Appearance: light/dark/system, compact density, font-size control, reduced motion. Preferences apply after Save preferences. Page preview is local; sending with context enabled takes a fresh snapshot rather than reusing the preview.
Pending: browser mutation/action tools, autonomous agent, multi-tab research, structured extraction studio/exports, workflow graph/recorder, scheduling. Screens say Not built yet. Native Chrome and live-provider verification statuses are in TEST_REPORT.md.
