# Current 0.3.3 NVIDIA/custom-provider update

See [CUSTOM_PROVIDERS_REPORT.md](CUSTOM_PROVIDERS_REPORT.md) for current changes, verification and limitations. Historical evidence below is preserved.

# Current 0.3.2 Ollama and Settings update

See [OLLAMA_SETTINGS_REPORT.md](OLLAMA_SETTINGS_REPORT.md) for this task’s changes, actual checks and limitations. Historical evidence below is preserved.

# 0.3.1 targeted argument fix

See [ARGUMENT_FIX_REPORT.md](ARGUMENT_FIX_REPORT.md#files-and-delivery) for the current file inventory and safety changes. Existing engine now includes reviewed argument-validation and text-selection changes; byte identity to upstream is not claimed.

# Changed-file summary

Baseline: NanoBrowser 19dc8e8a9be6ed06c0ef9ec7de8d84bf6a88c458. This is the prominent change inventory referred to by NOTICE. Modified source files carry Vistara notices. JSON/assets are identified here because their formats do not support ordinary comment headers.

Runtime architecture: preserved upstream agent/browser-control/CDP/ref/receipt/verification and provider SDK designs. Brand strings are changed consistently, including relevant tests/fixtures. Internal nb storage/protocol keys, NanoBrowser legacy migration format and probe identifiers are retained, not exposed as product branding. No old Vistara M2.1 implementation is retained; it is backed up separately.

Functional deviations authorized by the user: production analytics disabled; collection UI removed; original uninstall form cleared; product/tracking/store links replaced by own project/feedback destinations; Vistara logo/colors/themes and attribution. Necessary compatibility fixes: SWC build-only React plugin replaced by Babel React plugin; autorun cleanup handles signalCode and bounds termination. No Chrome policy bypass or replacement DOM-click engine.

## Upstream file changes

- modified: `.env.example`
- modified: `.github/ISSUE_TEMPLATE/bug_report.yml`
- modified: `.github/ISSUE_TEMPLATE/config.yml`
- modified: `.github/ISSUE_TEMPLATE/feature_request.yml`
- modified: `.gitignore`
- modified: `.prettierignore`
- modified: `AGENTS.md`
- modified: `CLAUDE.md`
- modified: `CONTRIBUTING.md`
- modified: `PRIVACY.md`
- modified: `README.md`
- modified: `SECURITY.md`
- modified: `entrypoints/offscreen/index.html`
- modified: `entrypoints/options/index.html`
- modified: `entrypoints/permission/index.html`
- modified: `entrypoints/sidepanel/index.html`
- modified: `entrypoints/welcome/index.html`
- modified: `fixtures/autorun.mjs`
- modified: `fixtures/upgrade/old-manifest.json`
- modified: `fixtures/upgrade/old-storage.json`
- modified: `package.json`
- modified: `pnpm-lock.yaml`
- modified: `public/_locales/en/messages.json`
- modified: `public/_locales/zh_CN/messages.json`
- modified: `public/_locales/zh_TW/messages.json`
- modified: `public/brand/logo-horizontal.png`
- modified: `public/brand/panel-wave.png`
- modified: `public/brand/wave.jpg`
- modified: `public/icon-128.png`
- modified: `public/icon-32.png`
- modified: `src/agent/__tests__/attachments.test.ts`
- modified: `src/agent/__tests__/completion.test.ts`
- modified: `src/agent/__tests__/context.test.ts`
- modified: `src/agent/__tests__/export.test.ts`
- modified: `src/agent/export.ts`
- modified: `src/agent/loop.ts`
- modified: `src/agent/prompt.ts`
- modified: `src/agent/records.ts`
- modified: `src/background/checks/analytics.ts`
- modified: `src/background/checks/eval.ts`
- modified: `src/background/checks/languages.ts`
- modified: `src/background/checks/optional-permissions.ts`
- modified: `src/background/checks/panel-run.ts`
- modified: `src/background/checks/save-file.ts`
- modified: `src/background/checks/upgrade.ts`
- modified: `src/background/checks/upload-measure.ts`
- modified: `src/background/checks/voice.ts`
- modified: `src/background/checks/welcome.ts`
- modified: `src/background/scenarios/set-i.ts`
- modified: `src/browser-control/core/__tests__/boundary.test.ts`
- modified: `src/browser-control/core/__tests__/url-policy.test.ts`
- modified: `src/browser-control/core/url-policy.ts`
- modified: `src/browser-control/host/puppeteer-browsers-stub.ts`
- modified: `src/extension/__tests__/analytics-payload.test.ts`
- modified: `src/extension/__tests__/upgrade.test.ts`
- modified: `src/extension/agent-session.ts`
- modified: `src/extension/analytics-payload.ts`
- modified: `src/extension/analytics.ts`
- modified: `src/extension/bindings.ts`
- modified: `src/extension/border.ts`
- modified: `src/extension/downloads.ts`
- modified: `src/extension/index.ts`
- modified: `src/extension/notify.ts`
- modified: `src/extension/run-manager.ts`
- modified: `src/extension/selection.ts`
- modified: `src/extension/uninstall.ts`
- modified: `src/extension/upgrade.ts`
- modified: `src/llm/__tests__/providers.test.ts`
- modified: `src/llm/errors.ts`
- modified: `src/llm/providers.ts`
- modified: `src/options/AboutSection.tsx`
- modified: `src/options/BrowserFeaturesCard.tsx`
- modified: `src/options/DataSection.tsx`
- modified: `src/options/MicrophoneCard.tsx`
- modified: `src/options/PrivacyCard.tsx`
- modified: `src/options/Welcome.tsx`
- modified: `src/side-panel/RatingCard.tsx`
- modified: `src/side-panel/__tests__/cards.test.tsx`
- modified: `src/side-panel/mic-permission.tsx`
- modified: `src/side-panel/state.ts`
- modified: `src/store/__tests__/legacy.test.ts`
- modified: `src/store/__tests__/rating.test.ts`
- modified: `src/store/__tests__/shortcuts.test.ts`
- modified: `src/store/analytics.ts`
- modified: `src/store/legacy.ts`
- modified: `src/store/rating.ts`
- modified: `src/store/settings.ts`
- modified: `src/store/shortcuts.ts`
- modified: `src/store/storage.ts`
- modified: `src/store/types.ts`
- modified: `src/ui/__tests__/manifest-permissions.test.ts`
- modified: `src/ui/icons.tsx`
- modified: `src/ui/index.css`
- modified: `src/ui/links.ts`
- modified: `src/ui/locales/en.json`
- modified: `src/ui/locales/zh_CN.json`
- modified: `src/ui/locales/zh_TW.json`
- modified: `src/ui/manifest-permissions.ts`
- modified: `src/ui/protocol.ts`
- modified: `wxt.config.ts`
- removed: `.github/FUNDING.yml`

## New verification/documentation

- `docs/ARCHITECTURE.md`
- `docs/NATIVE_VERIFICATION.md`
- `docs/PROGRESS.md`
- `docs/TEST_PLAN.md`
- `docs/TEST_REPORT.md`
- `docs/UPSTREAM_PROVENANCE.md`
- `scripts/package-rebuild.py`

New legal assets: NOTICE, THIRD_PARTY_NOTICES.md, public/LICENSE, public/NOTICE, public/THIRD_PARTY_NOTICES.md; original Vistara SVG/PNG assets replace original product artwork.

## Replacement of previous Vistara application

The prior src/components, src/core, src/features, src/entrypoints, src/styles, old standalone tests/scripts, package-lock and M2.1 documentation were removed from the active source, after backing up all 121 prior tracked files. No old agent manager, provider hub, transports or obsolete CSS/dependencies remain active. The original Git history, previous release artifacts and backup branch preserve recovery. New canonical entrypoints/, src/agent/, src/browser-control/, src/extension/, src/llm/, src/side-panel/, src/store/, src/options/ and src/ui/ come from the pinned source.
