# AI providers — M1

Status: implemented adapters; verification is mocked HTTP only until the user supplies their own key. Live Gemini and Groq tests: **NOT RUN**. No key was supplied.

The background worker alone constructs `createProvider('gemini' | 'groq', key)`. Keys are sent as `x-goog-api-key` (Gemini) or `Authorization: Bearer` (Groq), never in URLs. Content scripts never import the provider adapter.

Provider-neutral contract: runtime model discovery, `generate`, async `stream`, `generateStructured` with Zod validation, typed multi-turn messages and tool-call/results, cancellation and usage metadata. Tool calls are returned as data; this adapter never executes tools. The M1 product is read-only and exposes no action tools.

## Gemini

Runtime `GET https://generativelanguage.googleapis.com/v1beta/models`, paginated with at most 20 pages; retain models whose `supportedGenerationMethods` includes `generateContent`. `POST /v1beta/models/{user-selected-model}:generateContent` or `:streamGenerateContent?alt=sse`. Authentication is an HTTP header. Generation includes systemInstruction, contents, generationConfig, and optional functionDeclarations. Function-result messages preserve names/IDs and tool calls preserve returned thought signatures.

Sources read for this build: [Models API](https://ai.google.dev/api/models), [Generate content API](https://ai.google.dev/api/generate-content), [API keys](https://ai.google.dev/gemini-api/docs/api-key).

## Groq

Runtime `GET https://api.groq.com/openai/v1/models`; inactive models and known speech/moderation model names are filtered. `POST /openai/v1/chat/completions` with standard chat messages, optional function tools and streamed SSE deltas. Model discovery does not prove all advertised generation options; some models can reject temperature, structured mode or tools. Such errors remain explicit.

Sources: [Compatibility](https://console.groq.com/docs/openai), [Supported models](https://console.groq.com/docs/models).

## Capability and cost honesty

No model is automatically chosen and no free-tier entitlement is inferred from a model name. Metadata proves text generation where supplied; tool, image and structured-output support remain `unknown` when the list endpoint does not expose reliable per-model capability flags. The UI must not claim unknown support as verified. Availability, free-tier eligibility, provider terms and limits can change. Vistara cannot query or invent a remaining quota balance.

The user explicitly chooses the provider and model and separately consents to each provider's external processing. Page-context inclusion starts off. No provider failover exists. No backend, registration, paid library, local model or subscription is required by Vistara.

## Failure and cancellation policy

401 → auth_invalid; 403 → forbidden (or provider billing requirement); 429 → rate_limited/quota_exhausted. Error UI receives generic recovery guidance, never provider raw bodies, credentials or request headers. A validated Retry-After value is retained. **429 is never automatically retried**, even if the request retry count is configured. Only network failures and HTTP 500/502/503/504 can retry, bounded to two with backoff and jitter. Timeout includes body streaming and normal JSON body consumption; parent cancellation aborts the same request. Structured data must parse and pass the requested Zod schema; arbitrary text is never executed.

## Known limits

Real provider responses, free-tier account eligibility and per-model advanced features are unverified without the user's key. A successful model-list connection test establishes credentials/network access to listing, not successful generation. Endpoint model metadata cannot universally prove tool/image/structured support. Native Chrome/Windows provider integration is a separate acceptance check. Client-side keys cannot offer a server-side vault's protection; session-only storage is default and persistent storage requires disclosure.
