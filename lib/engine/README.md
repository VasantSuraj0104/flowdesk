# The Factors engine

Manual runs no longer go through n8n. This is the whole chain, in TypeScript:

```
POST /api/automations/factors/run
  └─> runFactors()
        ├─ parseRenderJob()   lib/engine/factors/parse.ts   (port of the n8n Code node)
        ├─ renderPng()        lib/engine/factors/steps.ts   (POST → Railway Chromium)
        └─ uploadPng()        lib/engine/factors/steps.ts   (PUT  → Cloudflare Worker)
```

## Why this was worth rebuilding

The manual path was a straight line of three HTTP calls to services you already
own. No OAuth, no connectors, no branching — n8n was pure overhead for it.

What we gained:

- **One less network hop.** Vercel → Chromium directly, instead of Vercel → n8n → Chromium.
- **Real errors.** `EngineError` carries the failing step, so the UI says
  "Render failed" or "Upload failed" instead of "n8n returned 500".
- **Per-step timings** returned with every run (`parse` / `render` / `upload` / `total`).
- **No webhook, token, or `Manual run?` branch** to maintain.

## What n8n still owns — and should

The **scheduled Notion path** stays in n8n, untouched. That side needs:

- Notion OAuth + token refresh
- Polling every 2 minutes
- The write-back to the Notion page

Rebuilding that means owning a Notion API client, token refresh, and a
cron/queue. Not worth it. n8n is the right tool there.

So: **n8n for the parts that are hard (auth, scheduling), our engine for the
parts that were never hard (three HTTP calls).**

## Parity

`parse.ts` was verified field-by-field against the original Code node across 10
input shapes — 10/10 identical. See `factors/__tests__/parse.parity.md`,
including the one latent bug in the original that the port fixes safely.

## Rollback

Set `FACTORS_ENGINE=n8n` and redeploy. Manual runs route back through the
webhook instantly; no code change.

## Timeouts

`maxDuration = 60` on the route (Vercel Hobby's ceiling; Pro allows 300).
`renderPng` aborts at 45s, `uploadPng` at 20s — so you get a clean
"Render timed out" instead of a platform-level 504.

If renders regularly approach 45s, that's the signal to add a queue
(BullMQ + Redis) and make runs async — the one thing n8n was giving you free.
