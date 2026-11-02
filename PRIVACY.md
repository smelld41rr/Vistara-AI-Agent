# Vistara AI privacy — modified NanoBrowser distribution

Production usage analytics are disabled in code, including when legacy analytics build variables are supplied. No Vistara backend, analytics account, uninstall feedback collection or tracking links are configured. Original PostHog and Google Forms uninstall destinations are not contacted. Local fixture-only analytics requests may be simulated by the upstream automated test build; they never enable production telemetry.

Conversations, provider configurations, API keys and browser/session settings use the pinned upstream local-first storage architecture. Keys are browser-local, not a remote vault, and go to the selected provider's endpoint. The upstream implementation uses persistent local key storage; it is not the former M2.1 session-key architecture. Do not assume data is encrypted as a server-side vault. Delete local data through Settings when desired. No old Vistara data is silently migrated or deleted.

The provider processes prompts, page observations, screenshots or attachments that the requested task sends. Voice input sends audio to the configured OpenAI/Gemini voice model. These requests are subject to provider terms, costs, retention and region availability. No live provider test has been authorized in this build task. Do not share secrets or information you are not authorized to process.

Chrome Debugger and page access are required by the upstream CDP browser engine; optional permissions are used for downloads, notifications and tab groups. Ask/Auto/site choices and the upstream sensitive-step handover remain. Page content is untrusted; automation still has risks and best-effort detection is not a guarantee. See SECURITY.md and the native checklist.

User-clicked external links lead to the Vistara repository, configured provider/model documentation, or legally required dependency/upstream attribution. NanoBrowser maintainers do not operate this distribution or endorse it.
