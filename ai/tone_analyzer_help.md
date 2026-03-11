# Tone Analyzer

## What it does
Detect tone and emotional characteristics. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.
- OPENAI_API_KEY for the live AI request this template makes.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| sourceText | Primary source text the worker analyzes before generating a result. | Enter text for tone analysis... |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the tone-analysis UI. |
| POST / | Returns primary tone, secondary tones, and evidence as JSON. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Sarcasm, mixed emotions, and very short snippets can produce blended tone results.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="500" frameborder="0"></iframe>
```
