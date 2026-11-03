# Ollama (Local) setup for Vistara AI

Vistara 0.3.2 uses the existing OpenAI-compatible Ollama adapter, not Ollama Cloud. Local inference has no provider-side per-token charge; hardware, installed models and context limits determine performance. No models are bundled, pulled or downloaded automatically.

## Connect

1. Install Ollama from its official distribution and run the application/service on your own machine. This cloud workspace is not your computer; its localhost does not reach your desktop Ollama.
2. Download a model of your choice manually in Ollama, after checking its size, available RAM/VRAM and tool support. For example, `ollama pull <chosen-model>` is a manual user action, not something Vistara performs.
3. Click the Vistara sidebar Settings icon. Chrome opens the extension's full Settings tab. Choose AI Providers → Add provider → Ollama (Local).
4. Keep Server URL `http://localhost:11434` (editable). The existing adapter uses `http://localhost:11434/v1` for inference and `/api/tags` for installed models. Repeated trailing `/v1` suffixes are normalized. Local Ollama needs no API key.
5. Click List Models to connect/refresh. Click an installed model's name, then Add. No installed entries means there is nothing to select yet. A manually entered name remains unverified until the server lists it and diagnostics pass.
6. Click Test Model. Vistara checks server membership and makes two short inference requests for strict structured click/set targets. They never execute browser actions. Only a passing model is offered to Agent selection. “Agent Ready” means these format diagnostics passed, not a guarantee of every task or an assertion of browser action success.
7. Choose the default model in the same Providers section, or select it in the sidebar. Storage subscriptions keep both views synchronized. An active task is not stopped by opening Settings; model changes follow the existing next-run behavior. No silent switch to a cloud provider when the selected Ollama provider becomes unready.

Changing the server URL clears learned compatibility/context facts and readiness; model names and explicit overrides remain. Test again. A failed test clears Ollama readiness. Existing settings, keys, conversations and other providers are preserved.

## Extension-origin access

Browser fetch errors cannot reliably distinguish not installed, stopped server, refused connection and CORS. Check that Ollama is installed/running and inspect its logs first. If the logs confirm origin rejection, copy the **exact origin displayed in the Vistara provider card**, such as `chrome-extension://YOUR_EXTENSION_ID`. The origin may change if you load another unpacked directory.

Do not use `chrome-extension://*` or `*`. Do not change the bind address to a public interface or expose port 11434 to the internet.

### Windows

Quit Ollama from the tray. Add a user environment variable through Windows Environment Variables:

```powershell
[Environment]::SetEnvironmentVariable('OLLAMA_ORIGINS', 'chrome-extension://YOUR_EXTENSION_ID', 'User')
```

Start Ollama again so it receives the new variable. A server launched from an existing shell may require a new shell; do not assume a running process picked up the change.

### macOS

For the desktop application:

```sh
launchctl setenv OLLAMA_ORIGINS "chrome-extension://YOUR_EXTENSION_ID"
```

Quit and reopen Ollama. A terminal-launched server instead receives the variable in that shell. Keep the existing local bind configuration.

### Linux

For a systemd system service, edit its override:

```sh
sudo systemctl edit ollama.service
```

```ini
[Service]
Environment="OLLAMA_ORIGINS=chrome-extension://YOUR_EXTENSION_ID"
```

Then restart the service:

```sh
sudo systemctl daemon-reload
sudo systemctl restart ollama
```

For a user service, use its corresponding `systemctl --user` commands rather than the system service. For a manually launched server, set the exact origin in that process's environment. Never disable browser security to fix CORS.

## Troubleshooting

- No connection: verify installation and running application/service, configured host/port, then Ollama logs. Vistara cannot conclusively detect a missing binary from browser fetch alone.
- No models: download one manually in Ollama, then refresh. Listing never invents available model names.
- Model not found/404: refresh the installed list and verify the URL/model tag.
- Unsupported or malformed tool calls: model remains Not Agent Ready. Try a tool-capable installed model. Strict Zod and fresh-reference protections stay enabled.
- Small context: inspect detected context/capability information and configure a suitable Ollama `num_ctx` within hardware limits. Vistara retains upstream context detection/compaction and bounded agent iterations.
- Memory error: unload other models or use a smaller model. No automatic large downloads.
- Timeout: the provider card allows 5–600 seconds (default 120) per inference attempt; metadata/listing requests are bounded separately. Increase cautiously or use a smaller model.
- CORS/origin refusal: use only the exact extension origin above, restart and check logs. A fetch failure alone does not prove CORS.

Agent actions continue through the original Chrome debugger/CDP engine, permissions, approvals, Stop and observable verification. Do not treat model prose as an action receipt. Use a controlled page for editor tests; hidden/internal Monaco/Ace inputs are not guessed or blindly clicked.
