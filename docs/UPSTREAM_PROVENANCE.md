# Upstream provenance

- Original: https://github.com/nanobrowser/nanobrowser
- Exact pinned commit: `19dc8e8a9be6ed06c0ef9ec7de8d84bf6a88c458` (GitHub verified).
- Acquisition: user-supplied GitHub source ZIP `nanobrowser-master.zip`; no fork or upstream remote.
- ZIP SHA-256: `9a44ca0141e2f4a3b11b442bd8c6eba1b86e5d14594b4efda2f47906e6986244`.
- ZIP comment exactly equals the pinned commit.
- Cryptographic verification: all 27 root file/tree Git object hashes match the pinned GitHub tree, recursively including file modes and the CLAUDE.md symlink. Thus source identity is not based merely on an untrusted filename/comment.
- 489 source files; extraction validates paths. The internal CLAUDE.md → AGENTS.md symlink was materialized as a regular documentation copy for cross-platform ZIP safety.
- Upstream baseline retained for comparison outside the deliverable; LICENSE is unchanged. Changes are itemized in CHANGED_FILES.md and NOTICE.

Existing Vistara GitHub baseline: `c35898d0ddc11765f0731f28d7ad7994ae4b5bb0`. Local prior tree includes its equivalent M2.1 source and authorized delivery documentation at `6ec0a45`. Initial working tree was clean. Backup branch `backup/vistara-m21-before-nanobrowser-20261102` and a complete external tracked-file archive preserve that tree. Rebuild branch: `rebuild/nanobrowser-vistara`. Existing .git/history and untracked local releases/work remain; only the explicitly superseded old application was replaced. No old agent/provider architecture is merged into the new one.
