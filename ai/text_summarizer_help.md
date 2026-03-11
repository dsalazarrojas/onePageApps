# Text Summarizer

## What it does
Paste text, get a concise summary using AI. After deployment, the main live route is `POST /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.
- OPENAI_API_KEY for the live AI request this template makes.
- Optional OPENAI_BASE_URL and OPENAI_MODEL if you use an OpenAI-compatible endpoint or want a non-default model.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| sourceText | Primary source text the worker analyzes before generating a result. | Paste or type text here... |
| maxWords | Soft word target used when the worker summarizes the input. | 150 |

## Live app endpoints
| Path | What it does |
|------|-------------|
| POST / | Accepts JSON text and returns a `summary` response. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- `maxWords` is a soft prompt instruction, so the final summary may land slightly above or below the target.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="500" frameborder="0"></iframe>
```
