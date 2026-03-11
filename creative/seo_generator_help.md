# SEO Generator

## What it does
Extract keywords and generate meta descriptions. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.
- OPENAI_API_KEY for the live AI request this template makes.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| pageText | Full page copy analyzed for SEO ideas. | Paste your page content... |
| brand | Optional brand name to weave into the SEO output. | Your brand name |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the SEO helper UI. |
| POST / | Returns keywords, meta description, and optimization tips as JSON. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Meta-description length is a target, not a guaranteed hard cut, so do a final manual review before publishing.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="500" frameborder="0"></iframe>
```
