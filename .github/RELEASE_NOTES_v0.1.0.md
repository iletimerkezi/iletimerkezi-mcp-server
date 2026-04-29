# v0.1.0 — Initial release

The first release of `@iletimerkezi/mcp-server`. Lets MCP-aware LLM clients (Claude Desktop, Cursor, Cline, …) talk to the [iletiMerkezi](https://www.iletimerkezi.com) SMS API through tool calls.

## What's in 0.1.0

**7 MVP tools**, all wired through a single generic dispatcher:

- `send_sms` — send to one or many numbers (`POST /v1/send-sms/json`)
- `get_report` — order delivery report (`POST /v1/get-report/json`)
- `get_balance` — account balance + SMS credits (`POST /v1/get-balance/json`)
- `get_sender` — approved sender (header) list (`POST /v1/get-sender/json`)
- `get_blacklist` — blocked numbers (`POST /v1/get-blacklist/json`)
- `add_blacklist` — block a number, idempotent (`POST /v1/add-blacklist/json`)
- `delete_blacklist` — unblock a number (`POST /v1/delete-blacklist/json`)

**Tool shapes are not authored in this repo.** They are pulled at runtime from `https://www.iletimerkezi.com/api/manifest.json`, which is generated from the canonical endpoint documentation. Live → 24h cache → build-time fallback chain keeps clients working offline and refreshes new endpoints within a day with no `npm update`.

**Authentication** via env (`ILETIMERKEZI_API_KEY` + `ILETIMERKEZI_API_HASH`) in your MCP client config. The 401 path surfaces the most common onboarding pitfall — the panel's "Allow API access" toggle — directly in the tool error message.

**Validated end-to-end** against the live API: get_balance, get_sender, send_sms (real delivery to a real handset), get_report (order status `114`, message status `111`).

## Install

```json
{
  "mcpServers": {
    "iletimerkezi": {
      "command": "npx",
      "args": ["-y", "@iletimerkezi/mcp-server"],
      "env": {
        "ILETIMERKEZI_API_KEY": "your-api-key",
        "ILETIMERKEZI_API_HASH": "your-api-hash"
      }
    }
  }
}
```

## Reference

- Overview: <https://www.iletimerkezi.com/docs/api/overview>
- Authentication: <https://www.iletimerkezi.com/docs/api/authentication>
- Manifest (machine-readable): <https://www.iletimerkezi.com/api/manifest.json>
