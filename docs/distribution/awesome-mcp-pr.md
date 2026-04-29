# awesome-mcp-servers PR draft

Target repo: <https://github.com/punkpeye/awesome-mcp-servers>

## Where the entry goes

Inside the **🔌 Other Services** or **📞 Communication** section (whichever is alphabetically appropriate at the time of PR). If a "SMS" subsection exists, use it; otherwise top-level.

## Entry text (markdown bullet)

```markdown
- [iletimerkezi/iletimerkezi-mcp-server](https://github.com/iletimerkezi/iletimerkezi-mcp-server) 📇 ☁️ - Send SMS, query delivery reports, and manage senders / blacklists through the [iletiMerkezi](https://www.iletimerkezi.com) Turkish SMS API (BTK-licensed bulk SMS, OTP, A2P).
```

Legend used by the upstream repo (verify at PR time, may have changed):

- 📇 — official server
- ☁️ — cloud service required (iletiMerkezi account)

## PR body

```markdown
Adding `@iletimerkezi/mcp-server` to the list. It's the official MCP integration for iletiMerkezi, a 13-year-old BTK-licensed bulk SMS / OTP / A2P platform serving 100k+ businesses in Turkey.

What it does:
- 7 tools: send_sms, get_report, get_balance, get_sender, get_blacklist, add_blacklist, delete_blacklist
- Tool shapes are pulled from a canonical API manifest at runtime, so the schema stays in lock-step with the live API
- 24h cache + build-time fallback so it works offline after first boot

Repo: https://github.com/iletimerkezi/iletimerkezi-mcp-server
npm: https://www.npmjs.com/package/@iletimerkezi/mcp-server
Tested end-to-end against the live API.
```

## Submit checklist

- [ ] Confirm package is published to npm and the install snippet in README works (`npx -y @iletimerkezi/mcp-server`).
- [ ] Confirm GitHub Release v0.1.0 is tagged and notes match `.github/RELEASE_NOTES_v0.1.0.md`.
- [ ] Pull latest awesome-mcp-servers main, branch `add-iletimerkezi`, edit the README, run their lint/format script if any, push, open PR.
- [ ] Watch for maintainer feedback on category placement or wording.
