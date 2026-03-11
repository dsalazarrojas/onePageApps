# FAQ Generator

## What it does
Generate frequently asked questions from content. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.
- OPENAI_API_KEY for the live AI request this template makes.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| sourceText | Primary source text the worker analyzes before generating a result. | Describe your product or service... |
| count | Requested number of generated items. | 5 |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the FAQ generator UI. |
| POST / | Returns generated question/answer pairs as JSON. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Requested FAQ counts are best effort; thin or repetitive source material can lead to fewer strong entries.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="500" frameborder="0"></iframe>
```
