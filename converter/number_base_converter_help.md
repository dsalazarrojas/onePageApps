# Number Base Converter

## What it does
Converts integers between base 2, 8, 10, 16, 32, and 64, with live browser-side updates plus 8-bit, 16-bit, and 32-bit signed/unsigned interpretations.

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
| GET / | Shows the Number Base Converter UI. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Base 64 in this tool uses a numeric digit alphabet of 0-9, A-Z, a-z, +, and / rather than MIME/Base64 text encoding.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="600" frameborder="0"></iframe>
```
