# Provider compatibility matrix — M2.1

Official documentation reviewed 2 November 2026. Documentation review is not live-account verification. All eleven live-provider checks are **UNVERIFIED**: no user credentials/live-test authorization supplied. Automated adapter/diagnostic tests use simulated HTTP. A model list never establishes generation, streaming, billing eligibility or tool support.

| Catalog entry | API base URL | Protocol/authentication | Official source |
|---|---|---|---|
| Google Gemini | https://generativelanguage.googleapis.com/v1beta | Native generateContent/streamGenerateContent; x-goog-api-key | https://ai.google.dev/api/generate-content |
| Groq | https://api.groq.com/openai/v1 | OpenAI Chat Completions; Bearer | https://console.groq.com/docs/openai |
| OpenAI | https://api.openai.com/v1 | Chat Completions; Bearer | https://developers.openai.com/api/reference/resources/chat |
| OpenRouter | https://openrouter.ai/api/v1 | Chat Completions; Bearer | https://openrouter.ai/docs/api_reference/overview |
| DeepSeek | https://api.deepseek.com | Chat Completions; Bearer | https://api-docs.deepseek.com/ |
| Together AI | https://api.together.ai/v1 | Chat Completions; Bearer; supports array model listing | https://docs.together.ai/docs/inference/openai-compatibility |
| Fireworks AI | https://api.fireworks.ai/inference/v1 | Chat Completions; Bearer | https://docs.fireworks.ai/tools-sdks/openai-compatibility |
| Cerebras | https://api.cerebras.ai/v1 | Chat Completions; Bearer | https://inference-docs.cerebras.ai/resources/openai |
| Mistral | https://api.mistral.ai/v1 | Chat Completions; Bearer | https://docs.mistral.ai/api/endpoint/chat |
| Anthropic Claude | https://api.anthropic.com/v1 | Native Messages; x-api-key + anthropic-version:2023-06-01; explicit direct-browser-access header | https://platform.claude.com/docs/en/api/messages/create · https://platform.claude.com/docs/en/api/models/list |
| Custom | User-configured HTTPS base | OpenAI-compatible Chat Completions + Bearer only | Supplied endpoint's documentation; no assumed compatibility |

Presets implement listing, text, SSE and function calling at the adapter level. Actual support is **model/account/endpoint dependent** and must pass separate diagnostics. Reasoning-only, audio/TTS, image generation, embeddings, moderation and non-Chat-Completions APIs are not represented as interchangeable chat protocols. Listing filters common non-chat model families; manual IDs remain available and may still fail. Gemini listing filters known TTS/audio families to avoid the previous misleading selection.

`max_completion_tokens` defaults to OpenAI/Groq/Cerebras; other compatible presets default to `max_tokens`. Choose the documented parameter for the selected endpoint/model. Temperature can be omitted; stream-usage metadata is opt-in (OpenAI/Groq presets enable it). No organization/project header, arbitrary extra JSON, router routing rules, OAuth or automatic paid fallback. For endpoints requiring such additions, this release is not compatible; do not mislabel it verified.

Gemini and Anthropic model discovery is paginated with a finite cap. Compatible discovery accepts `{data:[...]}` or array responses and does not implement arbitrary vendor pagination. Disable discovery and enter a manual exact model ID if unavailable. Some providers restrict listing separately from generation; failed listing does not prevent explicit manual text/stream/tool tests.

OpenAI Responses-only models are unsupported. Anthropic has a distinct native adapter; it is not sent an OpenAI request. Browser CORS/account restrictions and managed Chrome policy remain live acceptance requirements. No free-tier balances, costs, credits or lifetime capability guarantees are inferred.

Endpoint host-permission reference: https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns . Only the configured scheme/host/explicit port origin is requested on a click; no automatic all-site grant. Configured full API path is retained in requests; host permissions themselves do not restrict URL paths. Redirects never silently change endpoint.
