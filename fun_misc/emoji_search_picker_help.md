# Emoji Search & Picker

## What it does
Search through hundreds of emojis by keyword and click to copy them. Picked emojis accumulate in a clipboard strip for easy multi-emoji copying. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| query | Keyword to search emoji names and tags | love |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the emoji picker UI with search box and a full emoji grid. |
| POST / | Accepts `{ query }` JSON; returns matching emojis with name and tags (max 80 results). |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- The emoji dataset is embedded in the worker — no external API calls are made.
- Passing an empty `query` returns all available emojis.
- The UI accumulates picked emojis into a strip and copies the full string to the clipboard on each pick.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="600" frameborder="0"></iframe>
```
