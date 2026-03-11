# Grammar Checker

## What it does
Proofread and correct text with AI. After deployment, the main live route is `POST /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.
- OPENAI_API_KEY for the live AI request this template makes.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| text | Main text input sent to the worker. | Enter text for grammar checking... |

## Live app endpoints
| Path | What it does |
|------|-------------|
| POST / | Accepts text and returns `correctedText`. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- The worker returns the corrected result only, so save the original copy yourself if you want a side-by-side diff.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="500" frameborder="0"></iframe>
```
