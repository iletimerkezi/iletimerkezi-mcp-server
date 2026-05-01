# v0.2.0 — 3 new tools, refined İYS / scheduling / blacklist contracts

This release expands `@iletimerkezi/mcp-server` from 7 tools to **10**, adds a real-time İYS check on every commercial `send_sms` dispatch, and ships sharper input schemas based on live-API verification.

## What's new in 0.2.0

### 3 new tools (auto-discovered from the manifest)

- **`cancel_order`** — cancel a future-scheduled `send-sms` order before dispatch (`POST /v1/cancel-order/json`). `sendDateTime` must be `dd/MM/yyyy HH:mm` (no seconds — providing seconds causes the backend to ignore the schedule and dispatch immediately). On cancel, the order moves to status `115`.
- **`get_reports`** — list order summaries within a date range, max 10 days per call (`POST /v1/get-reports/json`). Request body uses `request.filter.{start, end, page?}`.
- **`iys_register`** — register İYS (Turkish messaging consent registry) records, batch up to 5000 per call (`POST /v1/consent/create/json`). Live verified on 2026-05-01 with brand 696422.

### Sharper schemas and notes

- **`send_sms`** — clarified that transactional messages fall outside Law 6563 commercial-message scope (KVKK obligations remain separate). `iys` decision rule: OTP / order notification → `"0"`; campaign / promotion → `"1"` + `iysList`. Note that the API may accept the request even when `iys` / `iysList` are missing; that is a backend tolerance, not a waiver of legal responsibility — commercial dispatches must always set the fields explicitly. `sendDateTime` format clarified to `dd/MM/yyyy HH:mm`. `receipents` (sic.) marked as intentional API compatibility — LLM clients should not auto-correct to `recipients`.
- **`get_blacklist`** — request shape and input schema fixed to nest `filter` / `page` / `rowCount` under `request.blacklist` (was top-level, which silently dropped pagination); response field renamed to `count` to match the live API.
- **Endpoint error-code lists** realigned with the live API — fictitious codes removed (e.g. send-sms `419/421/422/423/424/425`, get-report `426`), documented codes added (`400/402/450/453/454/457/468/469/470` for send-sms; `400/404/455/456` for get-report; `400/404` generics for blacklist).

### Removed before release

Two pre-release tools were withdrawn after live testing on 2026-05-01:

- **`get_inbox`** — the upstream endpoint is outside official support. Withdrawn from the public surface; archived in the website repo.
- **`iys_check`** — `consent/show` returns `consent: []` for verified İYS records (and even for invalid `brandCode` values). Not safe to expose. Archived. **İYS consent enforcement is fully covered by `send_sms iys=1`**, which performs a real-time İYS lookup before dispatch and drops non-consented recipients.

## Tool list (10)

| Tool | Endpoint |
|---|---|
| `send_sms` | `POST /v1/send-sms/json` |
| `cancel_order` | `POST /v1/cancel-order/json` |
| `get_report` | `POST /v1/get-report/json` |
| `get_reports` | `POST /v1/get-reports/json` |
| `get_balance` | `POST /v1/get-balance/json` |
| `get_sender` | `POST /v1/get-sender/json` |
| `get_blacklist` | `POST /v1/get-blacklist/json` |
| `add_blacklist` | `POST /v1/add-blacklist/json` |
| `delete_blacklist` | `POST /v1/delete-blacklist/json` |
| `iys_register` | `POST /v1/consent/create/json` |

## Upgrade

Existing installations pick up the new tool set automatically once the 24h manifest cache expires. To refresh immediately, delete `~/.cache/iletimerkezi-mcp/manifest.json` or reinstall the package — the `prepublishOnly` hook ships a fresh manifest snapshot in `dist/manifest.fallback.json` with each release.

No config changes are required. Existing `ILETIMERKEZI_API_KEY` / `ILETIMERKEZI_API_HASH` env vars continue to work.

## Reference

- Setup guide: <https://www.iletimerkezi.com/docs/mcp> · <https://www.iletimerkezi.com/en/docs/mcp>
- API manifest (machine-readable): <https://www.iletimerkezi.com/api/manifest.json>
- AI landing: <https://www.iletimerkezi.com/ai> · <https://www.iletimerkezi.com/en/ai>
- Changelog: [`CHANGELOG.md`](../CHANGELOG.md)
