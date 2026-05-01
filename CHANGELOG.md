# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] — 2026-05-01

### Added

- 3 new tools auto-discovered from the manifest, taking the published tool count from 7 to 10:
  - `cancel_order` — cancel a future-scheduled `send-sms` order before dispatch (`POST /v1/cancel-order/json`). `sendDateTime` must be `dd/MM/yyyy HH:mm` (no seconds — providing seconds causes the backend to ignore the schedule and dispatch immediately).
  - `get_reports` — list order summaries within a date range, max 10 days per call (`POST /v1/get-reports/json`). Request body uses `request.filter.{start, end, page?}`.
  - `iys_register` — register İYS (Turkish messaging consent registry) records, batch up to 5000 per call (`POST /v1/consent/create/json`). Live verified on 2026-05-01 with brand 696422.

### Changed

- `send-sms` `iys` field description sharpened: clarifies that transactional messages fall outside Law 6563 commercial-message scope (KVKK obligations remain separate), with concrete decision examples (OTP / order notification → `iys: "0"`; campaign / promotion → `iys: "1"` + `iysList`). Note that the API may accept the request even when `iys`/`iysList` are missing — that is a backend tolerance, not a waiver of legal responsibility, so commercial dispatches must always set the fields explicitly.
- `send-sms` `sendDateTime` description clarifies the format is `dd/MM/yyyy HH:mm` (no seconds).
- `send-sms` `request_shape` aligns `iysList` as conditional (closes the drift Copilot flagged on iletimerkezi-website PR #100).
- `send-sms` `receipents` (sic.) description strengthened: marks the typo as intentional API compatibility and warns LLM clients not to auto-correct to `recipients`.
- `iys-register` `brandCode` schema retained as `string|integer` after live verification on 2026-04-30 confirmed both types are accepted.
- `get-blacklist` `request_shape` and `input_schema` rewritten to nest `filter`, `page`, `rowCount` under `request.blacklist` (was top-level); response field renamed to `count` to match the live API. The previous shape silently dropped pagination.
- Endpoint error-code lists realigned with the live API and `error-codes.md`: removed fictitious codes (e.g. send-sms `419/421/422/423/424/425`, get-report `426`), added the documented set (`400/402/450/453/454/457/468/469/470` for send-sms; `400/404/455/456` for get-report; `400/404` generics for blacklist endpoints).

### Removed (pre-release)

- `get_inbox` — the upstream endpoint (`POST /v1/get-inbox/json`) is outside official support and was withdrawn from the public surface before this release shipped. It had been auto-discovered from the manifest in pre-release builds; the page is archived in the website repo at `docs/archive/api-inbox-{tr,en}-2026-05-01.md`.
- `iys_check` — the `consent/show` endpoint returns `consent: []` for verified İYS records (and even for invalid `brandCode` values), so it is not safe to expose as an MCP tool. The page is archived at `docs/archive/api-iys-check-{tr,en}-2026-05-01.md`. İYS consent enforcement is fully covered by `send-sms iys=1`, which performs a real-time İYS lookup before dispatch and drops non-consented recipients.

### Notes

No source-code changes were required — the server's tool list is generated from `https://www.iletimerkezi.com/api/manifest.json` at boot. Existing installations pick up the new set after the 24h cache expires; refresh by deleting `~/.cache/iletimerkezi-mcp/manifest.json` or republishing the npm package (the `prepublishOnly` hook ships a fresh manifest snapshot in `dist/manifest.fallback.json`).

## [0.1.0] — 2026-04-29

### Added

- Initial release with 7 MVP tools: `send_sms`, `get_report`, `get_balance`, `get_sender`, `get_blacklist`, `add_blacklist`, `delete_blacklist`.
- Manifest loader with three-tier resolution: live fetch (5s timeout) → 24h on-disk cache → build-time fallback shipped in the npm tarball.
- Generic tool dispatcher that wraps user input in the iletiMerkezi `request.authentication` envelope; per-tool shape comes from the manifest's `input_schema`.
- Authentication via `ILETIMERKEZI_API_KEY` + `ILETIMERKEZI_API_HASH` env vars; 401 responses surface the panel's "Allow API access" toggle directly in the tool error.
- `ILETIMERKEZI_MANIFEST_URL` and `ILETIMERKEZI_MCP_CACHE_DIR` env overrides for staging / development environments.
- `prepublishOnly` hook fetches the live manifest and writes it to `dist/manifest.fallback.json` so every published version ships with a current snapshot.
- 15 unit tests (auth, manifest cache/fallback, tool dispatch, 401 guidance, Markdown stripping) and an offline `tools/list` smoke script.

[Unreleased]: https://github.com/iletimerkezi/iletimerkezi-mcp-server/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/iletimerkezi/iletimerkezi-mcp-server/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/iletimerkezi/iletimerkezi-mcp-server/releases/tag/v0.1.0
