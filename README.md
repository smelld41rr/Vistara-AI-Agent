# Vistara AI 0.3.2 downloads

- [Chrome extension ZIP](https://github.com/smelld41rr/Vistara-AI-Agent/raw/refs/heads/main/release/Vistara-AI-Ollama-Settings-Chrome.zip)
- [Editable source ZIP](https://github.com/smelld41rr/Vistara-AI-Agent/raw/refs/heads/main/release/Vistara-AI-Ollama-Settings-Source.zip)
- [Ollama setup](docs/OLLAMA_SETUP.md) · [Actual checks and limitations](docs/OLLAMA_SETTINGS_REPORT.md)

868 tests passed; 4 live-provider tests skipped. Native Chrome and real local Ollama automation remain unverified. Earlier no-push notes below describe implementation-stage restrictions; the subsequent user instruction authorizes this GitHub delivery.

> Local update 0.3.2: [Ollama setup](docs/OLLAMA_SETUP.md) and [Settings verification](docs/OLLAMA_SETTINGS_REPORT.md). Existing adapters/settings restored and hardened; native Chrome and actual local inference remain unverified here. No push/deployment in this task.

> Local update 0.3.1: targeted browser argument fix. See [verification report](docs/ARGUMENT_FIX_REPORT.md). Native GUVI verification remains blocked; no GitHub push in this task.

# Vistara AI

A source-based rebrand of NanoBrowser at commit `19dc8e8a9be6ed06c0ef9ec7de8d84bf6a88c458`, licensed under Apache-2.0. This rebuild uses the actual upstream application and browser-control engine, not the old Vistara M2.1 engine. No GitHub fork was created. The existing Vistara repository/history and an M2.1 backup branch are retained.

The upstream architecture and user experience remain: one agent loop, Vercel AI SDK providers, Puppeteer frame management, stable browser element refs, Chrome Debugger/CDP actions, receipts and post-action checks. The side panel includes model/reasoning selection, Ask/Auto permissions, activity and conversations, shortcuts, attachments, file upload/save, voice model input, and responsive light/dark themes. Support is limited to what the pinned source implements; native/live behavior must be verified separately.

Vistara changes: Vistara name/logo, purple/yellow palette, branded translations, own untracked project links, no production analytics, no original uninstall-feedback form, and own feedback destination. Original source attribution remains in NOTICE, LICENSE and Settings → About. No upstream endorsement is implied. No Vistara backend/accounts/subscription were added.

## Downloads

- [Chrome extension ZIP](https://github.com/smelld41rr/Vistara-AI-Agent/raw/refs/heads/main/release/Vistara-AI-NanoBrowser-Chrome.zip)
- [Complete editable Source ZIP](https://github.com/smelld41rr/Vistara-AI-Agent/raw/refs/heads/main/release/Vistara-AI-NanoBrowser-Source.zip)
- [Unpacked extension](dist/) — download the repository ZIP, extract it, then load this folder in Chrome.
- [Actual test report](release/TEST_REPORT.md) · [Native acceptance checklist](release/NATIVE_VERIFICATION.md) · [SHA256 checksums](release/SHA256SUMS-NanoBrowser-Rebuild.txt)

805 unit tests passed; 4 live-provider tests skipped. Native Chrome/browser-render checks are blocked by this environment and remain unverified; no live GitHub/WayHome task completion is claimed.

## Development

Node >=24.22.1 and pinned pnpm 10.34.7. `corepack enable`; `pnpm install --frozen-lockfile`; `pnpm type-check`; `pnpm lint`; `pnpm test`; `pnpm build`; `pnpm zip`. Built unpacked extension: `dist/`; default upstream ZIP output: `dist-zip/`. Supported native checks: `pnpm autorun <checks>`; see fixtures/autorun.mjs and CONTRIBUTING.md. Use Chrome/Edge 125+. Do not bypass administrator policies or use remote CDP as a substitute for chrome.debugger.

## Install

Extract the supplied Chrome ZIP into a permanent folder. Open chrome://extensions → Developer mode → Load unpacked → choose the folder containing manifest.json. Open the sidebar from the toolbar; configure your own provider/model in Settings. Read the permission/privacy disclosures before allowing automation. Ask mode is the default; payment/access/secret-entry steps require the user as upstream specifies. Keys remain local and go only to selected model endpoints. Provider/voice requests may incur their own account costs; no credentials or live paid tests are supplied by this project.

Old M2.1 profiles/history are **not** silently imported into the different upstream schema. Back up/export old conversations before changing installations; the original data is not erased by this source rebuild. The old code is retained in local backup branch `backup/vistara-m21-before-nanobrowser-20261102` and GitHub history at commit `c35898d0ddc11765f0731f28d7ad7994ae4b5bb0`. Legacy files/releases are removed from the current main tree. Unpacked extension IDs/storage can change when installing from another folder.

See docs/TEST_REPORT.md, docs/NATIVE_VERIFICATION.md, docs/UPSTREAM_PROVENANCE.md and docs/CHANGED_FILES.md for actual results and boundaries. The user authorized replacing the existing GitHub main tree with this rebuild. No fork, deployment or store publication.

Optional source-release audit (from a Git checkout with the pristine pinned source available): `python3 scripts/package-rebuild.py --upstream-dir /path/to/nanobrowser-source`. Normal build/ZIP commands do not need the upstream comparison directory.
