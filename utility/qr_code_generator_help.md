# QR Code Generator

## What it does
Generate QR codes from text or URLs. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| text | Main text input sent to the worker. | https://example.com |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the QR code generator UI. |
| POST / | Returns a generated QR image payload and related metadata. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Very long URLs or dense payloads create busier QR codes that can be harder to scan on small screens.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="500" frameborder="0"></iframe>
```
