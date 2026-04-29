# Smithery listing draft

Smithery URL: <https://smithery.ai/server/@iletimerkezi/mcp-server> (assigned post-publish)

The `smithery.yaml` at the repo root is the source of truth for Smithery's installer. This file holds the listing copy.

## Display name

iletiMerkezi SMS

## One-liner

Send SMS, query delivery reports, and manage senders / blacklists through the iletiMerkezi Turkish SMS API.

## Long description

iletiMerkezi is a 13-year-old, BTK-licensed bulk SMS / OTP / A2P platform serving 100k+ businesses in Turkey. This MCP server exposes 7 tools so MCP-aware LLMs (Claude Desktop, Cursor, Cline, …) can:

- Send SMS to one or many recipients (`send_sms`)
- Pull per-recipient delivery reports (`get_report`)
- Read account balance and SMS credits (`get_balance`)
- List approved sender IDs (`get_sender`)
- Manage the blacklist (`get_blacklist`, `add_blacklist`, `delete_blacklist`)

Tool shapes come from a canonical API manifest at <https://www.iletimerkezi.com/api/manifest.json>. The server fetches it at runtime and falls back to a snapshot shipped with the package, so it works offline after first boot and stays in lock-step with the live API.

## Categories / tags

`sms`, `messaging`, `otp`, `a2p`, `turkey`, `communication`

## Authentication notes

Two env vars are required:

- `ILETIMERKEZI_API_KEY`
- `ILETIMERKEZI_API_HASH`

Both come from `panel.iletimerkezi.com` → Settings → Security → API Access. Users must also enable "Allow API access" under Settings → Security → Access Permissions, otherwise calls return 401. The server's 401 message walks users through this exact toggle.

## Submit checklist

- [ ] Package published to npm
- [ ] `smithery.yaml` lives at repo root, validated locally
- [ ] Verified `npx -y @iletimerkezi/mcp-server` boots a working stdio server
- [ ] Submit at <https://smithery.ai/new> using GitHub repo URL
