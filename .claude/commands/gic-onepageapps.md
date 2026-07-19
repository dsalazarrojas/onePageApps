# GIC OnePageApps Skill

Generate a one-page web app from a prompt, validate it, and deploy it to a
shareable URL — either a temporary GIC-hosted link or permanently on the user's
own free Cloudflare account. Follows the shared GIC skill shape
(`forms/docs/GIC_SKILL_SHAPE.md`).

## Prerequisites / Auth

Set your API key in the environment:
```bash
export GIC_API_KEY=opa_live_xxxx   # subscriber or gift key
# OR
export GIC_API_KEY=gic_admin_xxxx  # admin key (admin key-management commands only)
```

Or store it once in the shared GIC credentials file
`~/.config/gic/credentials.json` (chmod 600):
```json
{ "gicApiKey": { "onepageapps": "opa_live_xxxx" } }
```
The env var wins over the file. The key is sent only to the OnePageApps bridge
as the `X-GIC-API-Key` header and is never stored server-side.

Get a key from: OnePageApps → API Keys (requires Pro/Business subscription), or
ask the admin to create a gift key.

For **BYO deploys** you also need your own Cloudflare credentials
(`CF_ACCOUNT_ID` + `CF_API_TOKEN`) — run `cfSetup` once (guided, below). The
same pair also serves GIC Photo Filters custom filters.

## Two deploy modes — always establish which one the user wants

| | `deployGic` (temporary) | `deployByo` (permanent) |
|---|---|---|
| Where it runs | GIC's Cloudflare, `<slug>.onepageapps.gic.mx` | The user's own Cloudflare account |
| Lifetime | Plan limits — free: 1 app, expires in 7 days; Pro: 10 apps, no expiry | Permanent, user controls it |
| Needs | `GIC_API_KEY` only | `GIC_API_KEY` + Cloudflare creds (`cfSetup` once) |
| Best for | "I need a URL for the weekend / to put in an email" | "This is mine, keep it running" |

If the user didn't say, ask: **"Temporary GIC-hosted URL (free tier expires in
7 days) or permanent on your own free Cloudflare account?"**

## Commands

### Generate an app from a prompt
```bash
GIC_API_KEY=$GIC_API_KEY node $CLAUDE_PROJECT_PATH/cli/gic-onepageapps.js createApp "A countdown page for a wedding on Saturday with an RSVP button" --output js > app.js
```

### Edit an existing app
```bash
GIC_API_KEY=$GIC_API_KEY node $CLAUDE_PROJECT_PATH/cli/gic-onepageapps.js editApp app.js "Make the background dark blue and add a photo carousel" --output js > app.updated.js
```

### Validate
```bash
GIC_API_KEY=$GIC_API_KEY node $CLAUDE_PROJECT_PATH/cli/gic-onepageapps.js validate app.js
```

### Deploy GIC-hosted (temporary)
```bash
GIC_API_KEY=$GIC_API_KEY node $CLAUDE_PROJECT_PATH/cli/gic-onepageapps.js deployGic app.js --title "Wedding countdown"
# → { "url": "https://ab12cd.onepageapps.gic.mx", "slug": "ab12cd", "expiresAt": "..." }
```

### Deploy to the user's own Cloudflare (permanent)
```bash
# One-time setup (guided; verifies the token live, saves to ~/.config/gic/credentials.json):
node $CLAUDE_PROJECT_PATH/cli/gic-onepageapps.js cfSetup

# Then:
GIC_API_KEY=$GIC_API_KEY node $CLAUDE_PROJECT_PATH/cli/gic-onepageapps.js deployByo app.js --name wedding-countdown
# → the app runs at wedding-countdown.<their-subdomain>.workers.dev in THEIR account
```

BYO onboarding facts to relay when guiding a first-time user: Cloudflare cannot
create an account from the CLI — the user signs up once at
https://dash.cloudflare.com/sign-up (free plan is enough), copies their Account
ID from the dashboard sidebar, and creates a token from the "Edit Cloudflare
Workers" template at https://dash.cloudflare.com/profile/api-tokens. Their
credentials stay on their machine; the bridge forwards them to Cloudflare per
request and never stores them.

### Manage GIC-hosted apps
```bash
GIC_API_KEY=$GIC_API_KEY node $CLAUDE_PROJECT_PATH/cli/gic-onepageapps.js listApps
GIC_API_KEY=$GIC_API_KEY node $CLAUDE_PROJECT_PATH/cli/gic-onepageapps.js deleteApp ab12cd
```

### Admin (requires gic_admin_* key)
```bash
GIC_API_KEY=$GIC_ADMIN_API_KEY node $CLAUDE_PROJECT_PATH/cli/gic-onepageapps.js adminCreateKey --label "Maria" --plan business
GIC_API_KEY=$GIC_ADMIN_API_KEY node $CLAUDE_PROJECT_PATH/cli/gic-onepageapps.js adminListKeys
GIC_API_KEY=$GIC_ADMIN_API_KEY node $CLAUDE_PROJECT_PATH/cli/gic-onepageapps.js adminRevokeKey <keyId>
```

## Workflow example — the golden run

User: *"Make me a countdown for Saturday's wedding and give me a URL I can email."*

```bash
# 1. Generate
node cli/gic-onepageapps.js createApp "Elegant wedding countdown to Saturday 7pm, names Ana & Luis" --output js > wedding.js

# 2. Validate
node cli/gic-onepageapps.js validate wedding.js

# 3. Deploy (user chose temporary)
node cli/gic-onepageapps.js deployGic wedding.js --title "Ana & Luis"
# → https://x9k2pa.onepageapps.gic.mx (expires in 7 days on free)

# 4. Hand back: "Here's your link — it's live now and expires next Friday.
#    Want it permanent? I can put it on your own free Cloudflare account."
```

## Errors

| Status | Meaning | What to do |
|---|---|---|
| 401 | Invalid/missing key | Get one from OnePageApps → API Keys, or ask the admin for a gift key |
| 402 | Hosted deploy limit reached for plan | Free = 1 app: delete the old one (`deleteApp`) or upgrade; suggest `deployByo` as the free permanent path |
| 403 | Route not permitted for this key | Explain the gate |
| 429 | Rate limit | Wait, retry once, then report honestly |
| 5xx | Bridge/Cloudflare failure | Report; at most one retry |

## How Claude Should Use This Skill

1. Check auth: `GIC_API_KEY` env var, then `~/.config/gic/credentials.json` (`gicApiKey.onepageapps`). If missing, tell the user how to get a key.
2. Establish the deploy mode (temporary GIC vs permanent BYO) before deploying; for BYO, run `cfSetup` first if no Cloudflare creds exist.
3. Run the CLI subcommands via Bash: create → validate → deploy.
4. Use `--output js` when saving generated code to a file.
5. On error, map through the table above; always hand the user the final URL plus its expiry (if any).

## Finding the CLI Path

The CLI is at `cli/gic-onepageapps.js` relative to the onePageApps project root.
```bash
find . -name "gic-onepageapps.js" -path "*/cli/*" 2>/dev/null | head -1
```
