# Sentiment Analyzer

## What it does
Classify sentiment and provide reasoning. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.
- OPENAI_API_KEY for the live AI request this template makes.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| sourceText | Primary source text the worker analyzes before generating a result. | Enter text for sentiment analysis... |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows a browser form for interactive analysis. |
| POST / | Returns sentiment, confidence, and explanation as JSON. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Confidence is model-estimated, so treat it as guidance rather than a ground-truth score.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="500" frameborder="0"></iframe>
```
