# iletiMerkezi MCP Server

[![npm version](https://img.shields.io/npm/v/@iletimerkezi/mcp-server.svg)](https://www.npmjs.com/package/@iletimerkezi/mcp-server)
[![License](https://img.shields.io/npm/l/@iletimerkezi/mcp-server.svg)](LICENSE)
[![Node](https://img.shields.io/node/v/@iletimerkezi/mcp-server.svg)](package.json)
[![Glama score](https://glama.ai/mcp/servers/iletimerkezi/iletimerkezi-mcp-server/badges/score.svg)](https://glama.ai/mcp/servers/iletimerkezi/iletimerkezi-mcp-server)

Model Context Protocol server for the [iletiMerkezi](https://www.iletimerkezi.com) SMS API. Lets MCP-aware LLM clients (Claude Code, Cursor, Codex CLI, Gemini CLI, VS Code+Cline, Claude Desktop, …) send SMS, query delivery reports, and manage senders / blacklists through tool calls.

iletiMerkezi is a Turkish, BTK-licensed bulk SMS / OTP / A2P platform. Tool shapes (input schemas, descriptions, doc links) are derived from a canonical [API manifest](https://www.iletimerkezi.com/api/manifest.json) that is built from the official endpoint documentation, so this server stays in lock-step with the live API by design.

## Tools

| Tool | API endpoint | Notes |
|---|---|---|
| `send_sms` | `POST /v1/send-sms/json` | Send SMS to one or many numbers |
| `cancel_order` | `POST /v1/cancel-order/json` | Cancel a future-scheduled order before dispatch |
| `get_report` | `POST /v1/get-report/json` | Single-order delivery report (summary + per-recipient) |
| `get_reports` | `POST /v1/get-reports/json` | Order summary list within a date range (max 10 days) |
| `get_balance` | `POST /v1/get-balance/json` | Account balance (TL + SMS credits) |
| `get_sender` | `POST /v1/get-sender/json` | Approved sender (header) list |
| `get_blacklist` | `POST /v1/get-blacklist/json` | Blocked numbers (paginated) |
| `add_blacklist` | `POST /v1/add-blacklist/json` | Block a number (idempotent) |
| `delete_blacklist` | `POST /v1/delete-blacklist/json` | Unblock a number |
| `iys_register` | `POST /v1/consent/create/json` | Register İYS consent records (batch, max 5000) |
| `iys_check` | `POST /v1/consent/show/json` | Look up İYS consent status for a recipient |

## Installation

Five clients share the same JSON `mcpServers` schema; Claude Code and Codex CLI also expose a one-line CLI command. Pick your client below.

### Client → config file

| Client | Config file | Format |
|---|---|---|
| **Claude Code** | `claude mcp add ...` (CLI) · `.mcp.json` (project) · `~/.claude.json` (user) | JSON `mcpServers` |
| **Cursor** | `~/.cursor/mcp.json` (global) · `.cursor/mcp.json` (project) | JSON `mcpServers` |
| **Gemini CLI** | `~/.gemini/settings.json` (global) · `.gemini/settings.json` (project) | JSON `mcpServers` |
| **VS Code + Cline** | `cline_mcp_settings.json` (Cline → MCP Servers → Configure) | JSON `mcpServers` |
| **Claude Desktop** | `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) | JSON `mcpServers` |
| **Codex CLI** | `codex mcp add ...` (CLI) · `~/.codex/config.toml` | TOML `[mcp_servers.X]` |

### Shared JSON config (Claude Code, Cursor, Gemini CLI, VS Code+Cline, Claude Desktop)

Add this block to the relevant config file:

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

Fully quit and relaunch the client. The 11 tools appear under the `iletimerkezi` server.

### Claude Code — single command

User-scope (available across all projects):

```bash
claude mcp add iletimerkezi -s user \
  -e ILETIMERKEZI_API_KEY=your-api-key \
  -e ILETIMERKEZI_API_HASH=your-api-hash \
  -- npx -y @iletimerkezi/mcp-server
```

Close the current Claude Code session and start a new one. Tools appear as `mcp__iletimerkezi__*`. Remove with `claude mcp remove iletimerkezi -s user`.

### Codex CLI — TOML format

Via the CLI:

```bash
codex mcp add iletimerkezi \
  --env ILETIMERKEZI_API_KEY=your-api-key \
  --env ILETIMERKEZI_API_HASH=your-api-hash \
  -- npx -y @iletimerkezi/mcp-server
```

Or edit `~/.codex/config.toml` directly:

```toml
[mcp_servers.iletimerkezi]
command = "npx"
args = ["-y", "@iletimerkezi/mcp-server"]

[mcp_servers.iletimerkezi.env]
ILETIMERKEZI_API_KEY = "your-api-key"
ILETIMERKEZI_API_HASH = "your-api-hash"
```

### Verifying

On first use, try `get_balance` and `get_sender` — both are read-only, neither burns credits.

### Hosted clients (ChatGPT Apps, Gemini App, Claude Web Connectors)

These clients require **remote MCP** (HTTPS endpoints) and don't spawn local `npx` commands. This server ships in stdio (local) mode only today. Hosted support is on the roadmap.

## Credentials

Both values come from `panel.iletimerkezi.com` → **Settings → Security → API Access**. Copy them as-is — do not hash them yourself; the panel issues a precomputed hash.

You also need to enable **Allow API access** under **Settings → Security → Access Permissions**, otherwise every call returns `401`. This is the most common onboarding pitfall; the server's 401 error message points back to this toggle.

For the full authentication contract see [https://www.iletimerkezi.com/docs/api/authentication](https://www.iletimerkezi.com/docs/api/authentication).

## How tool shapes stay fresh

On boot the server tries, in order:

1. **Local cache** at `~/.cache/iletimerkezi-mcp/manifest.json`, valid for 24 hours.
2. **Live fetch** of `https://www.iletimerkezi.com/api/manifest.json` (5s timeout). On success, refreshes the cache atomically.
3. **Build-time fallback** (`dist/manifest.fallback.json`) shipped with the npm package — the manifest snapshot at the moment of `npm publish`.

This means new endpoints or schema changes published to the manifest propagate to running clients within 24 hours, with no `npm update` required. There is **no manually written tool schema** anywhere in this repo — the API documentation is the single source of truth.

You can override the manifest URL with `ILETIMERKEZI_MANIFEST_URL` for staging / preview environments.

## Local development

```bash
npm install
npm run build
npm test
```

Smoke-test the server against the live API with credentials in your shell:

```bash
ILETIMERKEZI_API_KEY=... ILETIMERKEZI_API_HASH=... node dist/index.js
```

This speaks MCP over stdio. Use an MCP client to interact, or pipe a JSON-RPC handshake manually for debugging.

## Reference

- MCP setup guide: [https://www.iletimerkezi.com/docs/mcp](https://www.iletimerkezi.com/docs/mcp) (TR) · [/en/docs/mcp](https://www.iletimerkezi.com/en/docs/mcp) (EN)
- Overview: [https://www.iletimerkezi.com/docs/api/overview](https://www.iletimerkezi.com/docs/api/overview)
- Authentication: [https://www.iletimerkezi.com/docs/api/authentication](https://www.iletimerkezi.com/docs/api/authentication)
- Error codes: [https://www.iletimerkezi.com/docs/api/error-codes](https://www.iletimerkezi.com/docs/api/error-codes)
- Manifest (machine-readable): [https://www.iletimerkezi.com/api/manifest.json](https://www.iletimerkezi.com/api/manifest.json)
- Release notes: [CHANGELOG.md](CHANGELOG.md)

## License

MIT — see [LICENSE](LICENSE).
