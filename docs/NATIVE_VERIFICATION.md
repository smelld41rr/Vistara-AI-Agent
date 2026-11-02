# Native Chrome / live acceptance

Status: BLOCKED / UNVERIFIED. The unmodified supported autorun launch attempted `appearance,providers-test,panel-run` with installed Chromium 154.0.8037.57. It aborted with SIGABRT before any reports: the installed SUID sandbox helper is not configured with its required ownership/mode. Managed policy also sets ExtensionInstallBlocklist=["*"]. Neither the sandbox/helper nor extension policy was changed/bypassed for native verification. No native check passed.

A separate compiled-UI headless fixture attempt produced no DOM/screenshot; a data-URL renderer probe also failed with GPU/zygote launch errors. No screenshot or UI browser pass is claimed. Unit tests, build, source/static checks are separate evidence. The autorun harness was fixed to report signal exits and bound cleanup instead of hanging.

No live model API key was supplied and no live provider requests were authorized. The four upstream live-provider unit checks remain skipped. Do not infer live success from simulated SDK/unit responses.

On an authorized Chrome/Edge 125+ installation, install/reload dist/ or the extracted Chrome ZIP, preserving your old data backup. The manifest now requires upstream Debugger, tabs, broad page access and other listed permissions; this is a substantial change from M2.1. Review/accept the real Chrome prompt. Never bypass administrator controls.

Every item below remains UNVERIFIED here:

1. Install; toolbar/sidebar/settings; dark/light and narrow layouts, three languages, keyboard shortcuts.
2. Configure a real provider/model; model/reasoning selection; genuine tool call and observation/result loop. Test voice only with your explicitly configured voice model/microphone permission.
3. Real navigation, reading, click, type, keyboard, hover, scroll, wait and multi-tab actions. Confirm actual receipts distinguish dispatch, reaction and expected result.
4. Same/cross-process iframes, open shadow DOM, stale refs and dynamic pages; screenshots/vision only where supported.
5. Ask/Auto/site Ask/Allow/Block behavior. Verify secret/payment/access steps hand over rather than allowing autonomous approval. Test consequential write confirmations and prompt-injection boundaries.
6. Stop/Resume/Continue/compaction, conversation/activity history, shortcuts, file attachments/upload/save, local storage/delete, worker restart and duplicate-action prevention.
7. Inspect network: no PostHog/original uninstall-feedback service, original website UTM links or unintended model endpoints. Production analytics remain disabled even with old build variables.
8. Primary acceptance task: “Open https://github.com/danishcodepy, click Repositories, find WayHome, open the frontend folder, inspect vercel.json if it exists and explain the contents.” Record observed URLs, actual DOM/file content and final response. If repository/folder/file is absent, report that rather than inventing it.

Record OS/Chrome/version/model/date and pass/fail evidence, with keys and private page content removed. Do not call task success without observable results. Stop cannot undo actions already dispatched.
