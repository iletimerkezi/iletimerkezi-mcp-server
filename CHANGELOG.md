# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] — 2026-04-29

### Added

- Initial release with 7 MVP tools: `send_sms`, `get_report`, `get_balance`, `get_sender`, `get_blacklist`, `add_blacklist`, `delete_blacklist`.
- Manifest loader with three-tier resolution: live fetch (5s timeout) → 24h on-disk cache → build-time fallback shipped in the npm tarball.
- Generic tool dispatcher that wraps user input in the iletiMerkezi `request.authentication` envelope; per-tool shape comes from the manifest's `input_schema`.
- Authentication via `ILETIMERKEZI_API_KEY` + `ILETIMERKEZI_API_HASH` env vars; 401 responses surface the panel's "Allow API access" toggle directly in the tool error.
- `ILETIMERKEZI_MANIFEST_URL` and `ILETIMERKEZI_MCP_CACHE_DIR` env overrides for staging / development environments.
- `prepublishOnly` hook fetches the live manifest and writes it to `dist/manifest.fallback.json` so every published version ships with a current snapshot.
- 15 unit tests (auth, manifest cache/fallback, tool dispatch, 401 guidance, Markdown stripping) and an offline `tools/list` smoke script.

[Unreleased]: https://github.com/iletimerkezi/iletimerkezi-mcp-server/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/iletimerkezi/iletimerkezi-mcp-server/releases/tag/v0.1.0
