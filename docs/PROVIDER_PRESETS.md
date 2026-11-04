# Provider presets and protocol evidence

Official documentation checked 4 November 2026. New presets use the **existing OpenAI-compatible Chat Completions adapter**. No API account or credits were configured, no live requests were made, and endpoints being documented does not establish every model's tool, vision, reasoning or API-feature support.

| Preset | API base URL | Official documentation |
| --- | --- | --- |
| NVIDIA NIM | `https://integrate.api.nvidia.com/v1` | [NVIDIA model API reference](https://docs.api.nvidia.com/nim/reference/openai-gpt-oss-120b-infer) |
| Groq | `https://api.groq.com/openai/v1` | [OpenAI compatibility](https://console.groq.com/docs/openai) |
| Together AI | `https://api.together.ai/v1` | [OpenAI compatibility](https://docs.together.ai/docs/inference/openai-compatibility) |
| Cerebras | `https://api.cerebras.ai/v1` | [OpenAI compatibility](https://inference-docs.cerebras.ai/resources/openai) |
| Fireworks AI | `https://api.fireworks.ai/inference/v1` | [OpenAI compatibility](https://docs.fireworks.ai/tools-sdks/openai-compatibility) |
| DeepInfra | `https://api.deepinfra.com/v1/openai` | [Chat Completions](https://docs.deepinfra.com/chat/overview) |

Together's current documentation uses `api.together.ai`, rather than the older `api.together.xyz` examples. NVIDIA documents Bearer authentication and the `/v1/chat/completions` path. Vistara keeps the exact model ID entered/listed by the provider, without aliases. A documented model-specific API reference is not a guarantee for every NVIDIA model.

Existing xAI, DeepSeek and Mistral presets are retained. [DeepSeek's current first-call documentation](https://api-docs.deepseek.com/) specifies `https://api.deepseek.com`, now used for newly added DeepSeek presets; stored provider endpoints are not rewritten. [Mistral's API reference](https://docs.mistral.ai/api) documents Chat Completions. [xAI's official REST reference](https://docs.x.ai/docs/api-reference) now emphasizes Responses and also lists Chat Completions; Vistara's existing xAI preset continues through its compatible Chat Completions path, and model diagnostics remain required. Gemini, OpenAI Responses, Anthropic, OpenRouter, Ollama and LM Studio keep their existing adapters/configuration choices.

## Custom provider workflow

1. Open the Vistara Settings tab → AI Providers → Add provider → NVIDIA NIM, another preset, or Custom (OpenAI-compatible).
2. Save an editable display name. The protocol control explicitly lists only **OpenAI-compatible Chat Completions**. Other arbitrary JSON APIs, Responses, Anthropic Messages, embeddings-only and other protocols do not become compatible by entering a URL here; use their existing dedicated adapter where implemented.
3. Enter the API **base** URL, then review and explicitly confirm it. The SDK appends `/chat/completions`; discovery appends `/models`. Vistara preserves vendor-specific paths and versions; it does not invent `/v1`, flatten Fireworks/DeepInfra paths, or accept a full `/chat/completions` operation URL as a base. HTTP(S), no embedded credentials/query/fragment. Remote HTTP displays an interception warning; localhost development remains supported.
4. Save the provider's API key in the masked key field. Keys are isolated under `nb.keys` in ordinary `chrome.storage.local`, **not encrypted at rest by Vistara**. The Chrome local storage area is restricted to trusted extension contexts before key reads/writes; webpage content scripts do not receive stored keys. They are not part of source packages, telemetry or conversation export configuration. Do not put keys in URLs or model IDs.
5. List/refresh models if supported, or **Add Model Manually** using an exact provider model ID. A failed or unsupported `/models` request does not prevent manual model tests.
6. For a saved model, Test Connection checks the model-list route, Test Text Generation requests a short public reply, and Test Tool Calling checks structured click/set targets plus tool-result continuation. Tests may use provider quota or incur configured-provider charges; they run only when invoked. Adding a compatible model does not automatically run paid inference. No billing, credit purchase or quota bypass is implemented.
7. Configured, Chat Ready, Agent Ready and Test Failed are distinct. Text-only models are not offered for Agent mode. After tools/continuation pass, choose the model in the default dropdown or sidebar. The existing storage subscriptions update the sidebar list.
8. Optional timeout: 5–600 seconds per inference attempt, default 120 for custom diagnostics. Existing agent iteration, retry, Stop, context/usage and verified-completion handling remain.

Changing a configured endpoint rotates the provider ID and removes its saved key and compatibility facts. Re-enter credentials explicitly for the new endpoint. Old in-flight tests cannot save results to the new provider, and changing a key increments its credential revision so a test using the previous key cannot restore readiness. Requests do not follow HTTP redirects for compatible-provider inference/discovery. No automatic fallback to a different provider when an explicit model is missing/unready.

## Acceptance still required on your machine

Configure your own API key/model, run the three diagnostics, inspect failures, then select the tested model and run an authorized browser task. Verify actual Chrome navigation/click/type receipts and observable results; passing a synthetic format probe does not prove native automation. Unsupported tools, tool-result messages or streaming mean the model is not Agent Ready. Provider compatibility is model-specific and can change.
