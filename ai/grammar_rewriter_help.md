# Grammar Rewriter

## What it does
Improve grammar and clarity while preserving style. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.
- OPENAI_API_KEY for the live AI request this template makes.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| sourceText | Primary source text the worker analyzes before generating a result. | Enter text for grammar improvement... |
| preserveStyle | When enabled, the rewrite keeps more of the original voice. | true |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the rewriting UI. |
| POST / | Returns improved copy, change notes, and suggestions. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Turning on `preserveStyle` keeps more of the original voice, but the output may be less aggressive about cleanup.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="500" frameborder="0"></iframe>
```
