# Meeting Summarizer

## What it does
Summarize meeting notes and extract action items. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.
- OPENAI_API_KEY for the live AI request this template makes.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| notes | Meeting notes or transcript text the worker summarizes. | Paste your meeting notes here... |
| maxWords | Soft word target used when the worker summarizes the input. | 200 |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the meeting summary UI. |
| POST / | Returns a summary plus extracted action items. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Action items are easiest to extract when notes include owners, deadlines, or clear task phrasing.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="500" frameborder="0"></iframe>
```
