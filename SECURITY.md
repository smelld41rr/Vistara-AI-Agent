# Security Policy

## Reporting a Vulnerability

If you find a security vulnerability, please **do not** disclose it in public issues, pull requests or discussions.

Report it through a [GitHub Security Advisory](https://github.com/smelld41rr/Vistara-AI-Agent/security/advisories/new), so it can be fixed before it is made public.

## Local Ollama configuration

Local provider setup must keep the server private and allow only the exact Vistara extension origin when required. No automatic model downloads or public bind changes. Settings diagnostics never execute their synthetic browser tools and validate strict structured targets; failed/untested Ollama models are unavailable to Agent mode. Endpoint changes invalidate prior results. Existing approval, permission, Stop and reference-identity enforcement remains. See docs/OLLAMA_SETUP.md.

## Custom endpoint credentials (0.3.3)

Keys use ordinary chrome.storage.local, not Vistara encryption. Key access first restricts the area to TRUSTED_CONTEXTS using the supported Chrome API. Endpoint changes require explicit review/confirmation and rotate identity/clear the key. Key changes invalidate tests and use a revision guard. Compatible requests reject operation URLs/embedded credentials/query/fragment and do not follow redirects; remote HTTP warns. Missing custom URLs never select the SDK default host. No cross-provider fallback for a missing explicit selection. See docs/CUSTOM_PROVIDERS_REPORT.md.
