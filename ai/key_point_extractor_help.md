# Key Point Extractor

## What it does
Extract actionable insights from text. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.
- OPENAI_API_KEY for the live AI request this template makes.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| sourceText | Primary source text the worker analyzes before generating a result. | Enter text to extract key points... |
| points | Controls the number of points setting for this worker. | 5 |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Serves a lightweight browser UI for entering source text. |
| POST / | Returns extracted key points and metadata as JSON. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Long source passages usually work best when they already contain clear structure or paragraph breaks.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="500" frameborder="0"></iframe>
```
