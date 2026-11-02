# Vistara AI — M2.1 Provider Hub (0.2.1)

Existing Chrome side-panel assistant and scoped browser tools, now with dynamic BYOK provider profiles. Native Gemini and Anthropic; shared OpenAI-compatible Chat Completions for Groq, OpenAI, OpenRouter, DeepSeek, Together, Fireworks, Cerebras, Mistral and custom endpoints. Separate Chat/Tasks defaults, explicit endpoint grants and independent text/stream/tool diagnostics. No provider availability/free-tier guarantee.

Release deliverables: `release/Vistara-AI-M2.1-Chrome.zip`, `release/Vistara-AI-M2.1-Source.zip`, `release/M2.1-TEST-REPORT.md` and checksums. The user explicitly authorized M2.1 GitHub delivery to this public repository. Earlier M2 artifacts remain for rollback.

- [Download M2.1 Chrome extension ZIP](https://github.com/smelld41rr/Vistara-AI-Agent/raw/refs/heads/main/release/Vistara-AI-M2.1-Chrome.zip)
- [Download M2.1 editable Source ZIP](https://github.com/smelld41rr/Vistara-AI-Agent/raw/refs/heads/main/release/Vistara-AI-M2.1-Source.zip)
- [Test report](release/M2.1-TEST-REPORT.md) · [SHA256 checksums](release/SHA256SUMS-M2.1.txt)

Extract the Chrome ZIP and load/reload its manifest folder at `chrome://extensions`. See [installation and usage](docs/PROVIDER_HUB_USAGE.md), [compatibility matrix](docs/PROVIDER_COMPATIBILITY.md), [architecture](docs/PROVIDER_ARCHITECTURE.md), [test report](docs/M2.1-TEST-REPORT.md), [native acceptance checklist](docs/M2.1-NATIVE-VERIFICATION.md) and [limitations](docs/KNOWN_LIMITATIONS.md).

Keys remain in trusted extension session storage by default, local persistence only on explicit opt-in. No keys in pages/exports. Existing Gemini/Groq profiles, keys and IndexedDB conversations migrate without deletion. Changing endpoint/model/key invalidates tool proof. Browser tools require passed text AND no-op function-result tests plus existing site consent/fresh action approvals. Credential entry, arbitrary JavaScript, CAPTCHA/security bypass and silent cross-provider history transfer remain blocked. Chat stays read-only, page context OFF by default.

**Verification boundary:** unit/integration and actual DOM/compiled UI fixture tests use mocked Chrome privilege APIs and provider HTTP. Live providers are UNVERIFIED; native installed-extension testing is BLOCKED by managed browser policy. No policy bypass. User-reported M1 Chrome checks are separate historical evidence. No M3, workflows/schedules, deployment or store publication.

Development: Node >=24.15, npm, Python 3 for ZIP packaging, Chromium for fixtures. `npm ci`; `npm run typecheck`; `npm run lint`; `npm test`; `npm run build`; `npm run test:e2e`; `npm run test:m2`; `npm run test:m21`; `node scripts/security-scan.mjs --m21`; `npm run zip:m21`. Load `.output/chrome-mv3`. Browser tests need localhost sockets and Chromium (`CHROMIUM_PATH`, default `/usr/bin/chromium`). No live automated requests without supplied credentials AND explicit approval.

Repository history and earlier M2 reports/artifacts are retained. Current instructions supersede historical Gemini-only Tasks/setup statements in earlier milestone documents.
