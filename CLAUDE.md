# CLAUDE.md - iletimerkezi-mcp-server

Bu repo, iletiMerkezi SMS API'sinin resmi **Model Context Protocol (MCP) server**'ıdır. npm'de `@iletimerkezi/mcp-server` olarak yayınlanır; müşteriler bunu kendi MCP-uyumlu istemcilerinde (Claude Code, Cursor, Codex CLI, Gemini CLI, VS Code+Cline, Claude Desktop) çalıştırarak LLM üzerinden SMS gönderir, rapor sorgular, gönderici ve blacklist yönetir. Yani kullanıcılar hem son müşteriler hem de o müşterilerin LLM istemcileridir.

**Repo PUBLIC.** github.com/iletimerkezi/iletimerkezi-mcp-server dünyaya açıktır. Her commit, yorum, PR ve bu dosya dahil her satır dışarıdan görünür. Sonuçları:
- Türkçe iç not, TODO, sohbet alıntısı, ajan referansı public source'a yazılmaz.
- Credential (API key/hash) hiçbir koşulda commit edilmez; repo private olsaydı bile edilmezdi.
- Bu CLAUDE.md bir iç çalışma dosyasıdır ama public'te durur; hassas hiçbir şey içermez ve içermeyecek.

**Tier: T0.** Müşteri-yüzlü SDK yüzeyi. Bir regresyon, müşterilerin MCP istemci konfigürasyonlarını ya da tool davranışını kırar ve doğrudan onların üretim akışına yansır. T0 disiplini gevşetilmez; "acil" gerekçesiyle kısaltma yok.

eMarka'nın genel çalışma standartları geliştirici ortamında ayrıca tanımlıdır; bu dosya o standartların bu repoya düşen bağlayıcı özetidir.

---

## Stack ve komutlar

- **Dil:** TypeScript (strict, ES2022, `module: Node16`), tam ESM (`"type": "module"`).
- **Runtime:** Node >= 18. Tek prod dependency: `@modelcontextprotocol/sdk`.
- **Test:** Jest + ts-jest (`jest.config.cjs`, `tsconfig.test.json`).
- **Transport:** yalnızca stdio (local). Remote/HTTP transport henüz yok; hosted istemciler (ChatGPT Apps, Gemini App, Claude Web Connectors) roadmap'te.

```bash
npm install
npm run build        # tsc -> dist/
npm run lint         # tsc --noEmit (type-check)
npm test             # jest
npm run dev          # tsc --watch
npm start            # node dist/index.js (stdio MCP server)
npm run fetch-fallback   # canli manifest'i dist/manifest.fallback.json'a yazar
```

Canlı API'ye karşı smoke test: `ILETIMERKEZI_API_KEY=... ILETIMERKEZI_API_HASH=... node dist/index.js` (stdio üzerinden MCP konuşur).

Değişiklik sonrası doğrulama sırası: `npm run lint` -> `npm run build` -> `npm test`.

---

## Dosya yapısı

```
src/
  index.ts     bin entrypoint (#!/usr/bin/env node), StdioServerTransport
  server.ts    MCP Server; ListTools + CallTool handler'lari
  auth.ts      env'den credential okuma + MissingCredentialsError
  manifest.ts  3 katmanli manifest yukleme (cache -> live -> fallback)
  tools.ts     manifest'ten tool uretimi, executeTool, 401/hata rehberi
  http.ts      iletiMerkezi API cagrisi (request.authentication envelope)
  types.ts     ortak tipler
tests/         auth / manifest / tools jest testleri + fixtures/
scripts/       fetch-fallback-manifest.mjs, smoke-test.mjs
dist/          tsc ciktisi + manifest.fallback.json (npm tarball'a girer)
```

Not: `src/http.ts` bir HTTP server değil, iletiMerkezi API'sine giden istemcidir. Karıştırma.

**Tool listesi kaynak kodda tanımlı DEĞİLDİR.** Tool'lar boot'ta `https://www.iletimerkezi.com/api/manifest.json` manifestinden üretilir. Şu an 11 tool: `send_sms`, `cancel_order`, `get_report`, `get_reports`, `get_balance`, `get_sender`, `get_blacklist`, `add_blacklist`, `delete_blacklist`, `iys_register`, `iys_check`. Yeni endpoint eklemek/şema düzeltmek için repoya elle şema yazılmaz; manifest güncellenir, istemciler 24 saatlik cache TTL içinde otomatik alır.

---

## Branch akışı

`main`'e doğrudan push YASAK. Her değişiklik feature branch + PR üzerinden gider; kullanıcı "push et" dese bile varsayılan branch + PR. PR sonrası Copilot review yorumları takip edilir ve değerlendirilir.

---

## Kritik kurallar

1. **Credential yalnızca runtime env'den gelir.** `ILETIMERKEZI_API_KEY` + `ILETIMERKEZI_API_HASH` istemcinin MCP config env'inde tutulur, `auth.ts` bunları `process.env`'den okur. Repoda `.env` yoktur ve gerekmez; test fixture'ları sahte değer kullanır. Gerçek key/hash asla commit'e girmez.
2. **Upstream hata şeffaflığı.** `executeTool`, iletiMerkezi API yanıtının HTTP status'unu, `response.status.code`'unu, tam JSON gövdesini ve request URL'ini tool çıktısına yansıtır; 401 için panel "Allow API access" toggle'ına yönlendiren rehber verir. Bu davranış korunur, generic "bir sorun oluştu" mesajına indirgenmez.
3. **Public surface stabildir (1.0.0'dan beri).** Tool envanteri, request/response şekilleri, env değişkenleri (`ILETIMERKEZI_API_KEY`, `ILETIMERKEZI_API_HASH`, `ILETIMERKEZI_MANIFEST_URL`, `ILETIMERKEZI_MCP_CACHE_DIR`) ve manifest-driven auto-discovery kontratı stabil. Bunları kıran değişiklik = breaking change = major bump = müşterilerin config'i bozulur. T0'da bu kabul edilemez; kaçınılmazsa CHANGELOG + major sürüm + geçiş notu zorunlu.
4. **Manifest kontratını bozma.** 3 katmanlı yükleme (24 saatlik cache -> 5 saniye timeout'lu live fetch -> build-time fallback) istemciyi `iletimerkezi.com` erişilemezken bile ayakta tutar. Bu zincir kısaltılmaz.

---

## Release ve versiyonlama

- **Yayın:** npm scoped public paket (`@iletimerkezi/mcp-server`, `publishConfig.access: public`), SemVer.
- **`prepublishOnly` hook:** `fetch-fallback` (taze manifest snapshot) -> `build` -> `test`. Yani her yayın, o anki manifesti `dist/manifest.fallback.json` olarak paketler.
- **CHANGELOG.md** Keep a Changelog formatında elle güncellenir; her sürüm için release notu yazılır.
- **Dağıtım yüzeyleri:** npm, Smithery (`smithery.yaml`), Glama (`glama.json`), Docker (`Dockerfile`), Awesome MCP Servers. Sürüm çıkarken bunların pinlenmiş sürümlerini de gözden geçir.

---

## Repo'ya özgü kritik notlar

- **Tool'lar manifest'ten gelir, kodda yok.** En sık yapılacak hata: eksik/yanlış tool davranışını `src/` içinde şema yazarak düzeltmeye çalışmak. Kaynak, iletiMerkezi API dokümantasyonundan üretilen manifest'tir; düzeltme oraya gider.
- **Sürümün tek kaynağı `package.json`.** `server.ts` handshake sürümünü runtime'da `package.json`'dan okur (`SERVER_VERSION`); elle sürüm sabiti yazılmaz. Regression testi `tests/server.test.ts`'te.
- **`Dockerfile` sürümü build arg ile pinli** (`ARG MCP_VERSION`); release'de default değer yeni sürüme çekilir.
- **CI aktif.** `.github/workflows/ci.yml`: her PR ve main push'ta Node 18/20/22 üzerinde lint + build + test koşar. Merge öncesi CI yeşil olmalı.
- **`AGENTS.md` yok.** Kısa bir AGENTS.md eklenmesi ayrı bir iş olarak değerlendirilebilir.
