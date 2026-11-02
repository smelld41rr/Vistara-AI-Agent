# Native extension verification boundary

The production extension was launched through Playwright's persistent Chromium context with standard `--load-extension` and `--disable-extensions-except` flags. The test does not modify browser policies. It excludes Playwright's default `--disable-extensions` flag so that a normal unpacked extension can load on an unmanaged browser.

Observed environment policy from `/etc/chromium/policies/managed/extensions.json`:

```json
{"ExtensionInstallBlocklist":["*"],"ExtensionInstallSources":[]}
```

No production Vistara service worker appeared within the bounded wait. The native test opened `chrome://policy` and records the policy evidence in `docs/browser-results.json`. **Status: BLOCKED.** This is not a native installation pass. The administrative configuration was left unchanged.

The first launch in the restricted command sandbox could not open Chromium sockets or bind the local fixture server (`EPERM`). Rerunning the same test with the supported execution environment network permission allowed Chromium and loopback fixture serving; the extension restriction remained. This did not grant or alter Chrome extension policy.

`npm run test:e2e` runs the reproducible browser harness. Its mock-browser category executes real production React and page-reader bundles against a local fixture server with an explicitly scripted Chrome/background substitute. The real IndexedDB check bundles the production storage module into a temporary test-only IIFE; only Chrome storage is mocked, while IndexedDB transactions and a second independent database connection are real. Those checks do not establish privileged Chrome API behavior.

## Manual Windows checklist

Use a personal or otherwise authorized unmanaged Chrome profile. Do not change an organization policy to make this test pass.

1. Extract `Vistara-AI-Chrome.zip` into a persistent folder. Confirm `manifest.json` is directly inside it.
2. Open `chrome://extensions`, enable Developer mode if permitted, choose Load unpacked and select that folder.
3. Confirm there are no extension errors. Verify the Vistara toolbar popup opens and its Open Vistara AI button opens the actual side panel.
4. Confirm the initial page-context toggle is OFF. Preview an ordinary website only after invoking the extension in that tab. Confirm internal pages fail with an actionable message.
5. In Settings, add a user-owned Gemini key in session storage. Test the connection, grant only the Gemini API origin, discover models, and explicitly choose a supported model. Review current provider free-tier terms; no unlimited usage is promised.
6. Accept the Gemini disclosure and save preferences. Send a text-only message. Turn on page context deliberately and summarize the actual page. Confirm source URL and facts match the page.
7. Stop generation mid-response. Reload the background service worker during a request and confirm history is marked interrupted; no request should replay automatically.
8. Verify provider consent is independent by switching to Groq. No request should be sent without its own key, provider permission and consent.
9. Verify history restore/export/delete and Clear all local data. Close and reopen Chrome to confirm a session-only key is gone.
10. Check keyboard navigation, light/dark/system themes and 320–480px panel widths on Windows. Real screen-reader and native side-panel user-gesture behavior remain manual.

Gemini/Groq live network calls were **NOT RUN** in this build environment because no user API key was supplied. A mock provider is not a live provider test.
