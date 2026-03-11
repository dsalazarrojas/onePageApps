# HTML Entity Encoder / Decoder

## What it does
Encodes special characters into HTML entities, decodes named and numeric entities back to plain text, and includes a quick reference table for common entities.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| — | No configuration fields required. | — |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the HTML entity encoder / decoder UI. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Numeric entities are handled broadly, but only the built-in common named entities are converted back to characters.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="600" frameborder="0"></iframe>
```
