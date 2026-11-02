# Delivery and retrieval

## Current M2 delivery
The latest explicit user instruction keeps the repository PUBLIC and authorizes sanitized M2 upload. New artifacts are Vistara-AI-M2-Chrome.zip, Vistara-AI-M2-Source.zip, M2-TEST-REPORT.md, M2-NATIVE-VERIFICATION.md and SHA256SUMS-M2.txt. Earlier packages remain for rollback. No M3, deployment or store publication. Workspace attachment export is unavailable, so authorized GitHub delivery is used.

## GitHub delivery authorization

The user explicitly requested uploading all project files to https://github.com/smelld41rr/Vistara-AI-Agent so they can download them. This authorizes the requested repository upload and supersedes the earlier no-push condition for this delivery. Source, docs, tests, original assets and verified archives are included; secrets, node_modules, caches and work logs are excluded. Download links are in the repository README. The workspace-only retrieval limitation below records the earlier environment constraint.

## Prepared artifacts

The project release folder contains:

- Vistara-AI-Chrome.zip — current M0/M1 production extension; manifest.json directly at archive root.
- Vistara-AI-Source.zip — editable source, configs, tests and docs; node_modules, .git, .env, caches and work logs excluded.
- SHA256SUMS.txt — checksums of final archives.
- archive-verification.json — actual size, entry count, SHA256 and integrity/secret-pattern results.

## Export limitation

The configured projectless download location /codex/browser/projectless/0002-hi/output is absent in the managed execution environment. Creating it failed with a read-only-root-filesystem error, including a retry with the supported filesystem grant. There is no callable artifact-upload/export tool in the active toolset. This is a filesystem/export limitation, not a ZIP validation failure. No remote push, publication or external upload was attempted. Filesystem paths below are storage locations, not working web/download links.

## Retrieve safely

Open the shared workspace's file access/download interface, if the client exposes it, and copy/download these files individually from /workspace/vistara-ai/release/: Vistara-AI-Chrome.zip, Vistara-AI-Source.zip, SHA256SUMS.txt and archive-verification.json. If using a workspace terminal, the exact locations can be listed with `ls -lh /workspace/vistara-ai/release/`. Use the client's supported workspace file-export/download facility; do not enable public hosting or push to a repository just to retrieve them. If this client has no workspace export at all, retrieval is blocked until an export-enabled workspace is available; no fabricated attachment link is provided.

Once copied, verify the SHA256 against SHA256SUMS.txt. On Windows PowerShell: `Get-FileHash .\Vistara-AI-Chrome.zip -Algorithm SHA256` and repeat for Source. Extract Chrome ZIP to a permanent folder, then load that folder through chrome://extensions → Developer mode → Load unpacked, only on an authorized unmanaged Chrome profile. Follow INSTALL_WINDOWS.md and NATIVE_VERIFICATION.md.

## Verification boundary

Latest universal check run: build/typecheck/lint exit 0; 66 unit/integration tests pass (6 files). Compiled fixture-browser suite: 18 checks pass, zero console/page errors. Archive checks pass. Native installation is BLOCKED by managed ExtensionInstallBlocklist=["*"]. Live Gemini/Groq not run because no user key was supplied.

This is a staged read-only M0/M1 build. M2–M8 remain pending. The PDF Session 2 page 6 says: “Milestone 1 must be verified first; if it is not, say so and stop.” Native gate needs the manual checklist before browser actions can begin.
