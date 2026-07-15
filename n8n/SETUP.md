# Wiring Factors: app → n8n → app

## 1. Import the workflow

In n8n: **Workflows → Import from File** → `factors-two-triggers.json`

It's your existing workflow **plus** a webhook path. Nothing in the original
chain was changed — the Parse / Browserless / Upload / Notion nodes are byte
for byte identical.

### What was added

| Node | Why |
|---|---|
| `Webhook — manual run` | POST entry point for the app's Run now button |
| `Normalize webhook input` | Reshapes the POST body into the flat `Type/Background/content/assets/id` shape Parse already expects — this is why Parse needed zero edits |
| `Manual run?` | After upload, splits the two paths |
| `Respond — return image URL` | Returns the PNG url to the app |

### How the two triggers coexist

```
Schedule Trigger ──> Get many pages ──> If ──┐
                                             ├──> Parse ──> Browserless ──> Upload ──> Manual run?
Webhook ──> Normalize ───────────────────────┘                                          │
                                                                   ┌────────────────────┴──────┐
                                                       (true) Respond to app        (false) Update Notion
```

The `Normalize` node stamps `id: "manual-<timestamp>"`. The `Manual run?` IF
checks whether `pageId` starts with `manual-`:

- **Manual (webhook)** → returns the image URL to the app. Skips Notion,
  because there's no real page to write back to.
- **Scheduled (Notion)** → `pageId` is a real UUID, so it updates the Notion
  page exactly as before.

## 2. Secure the webhook

On the `Webhook — manual run` node:

1. **Authentication** → Header Auth → create credential
2. Header **Name**: `x-flowdesk-token`
3. Header **Value**: any long random string — this becomes `N8N_WEBHOOK_TOKEN`

Without this, anyone who learns the URL can trigger renders.

## 3. Activate + copy the URL

Activate the workflow, then open the Webhook node and copy the **Production URL**
(not the Test URL — that only works while you're clicking "Listen for test event").

It looks like: `https://your-n8n-host/webhook/factors-render`

## 4. Set the env vars

Local — create `.env.local`:

```
N8N_FACTORS_WEBHOOK_URL=https://your-n8n-host/webhook/factors-render
N8N_WEBHOOK_TOKEN=the-random-string-from-step-2
```

Vercel — **Settings → Environment Variables** → add the same two → redeploy.

`.env.local` is gitignored, so secrets never reach GitHub.

## 5. Test it

Open `/automations/factors`, fill in Content, hit **Run now**. The PNG should
appear in the output panel.

### If it fails

| Message | Cause |
|---|---|
| `N8N_FACTORS_WEBHOOK_URL is not set` | Env var missing, or you didn't redeploy after adding it |
| `n8n returned 404` | Workflow isn't active, or you used the Test URL |
| `n8n returned 403` | Token mismatch between `.env` and the Header Auth credential |
| `n8n did not return JSON` | The `Respond` node wasn't reached — check the n8n execution log |
| Timeout | Chromium render exceeded the limit. The route allows 60s (`maxDuration`) |

## Note on CORS

Not an issue: the browser calls **your** API route (`/api/automations/factors/run`),
and the server calls n8n. The webhook URL and token never reach the browser.
