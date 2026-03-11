# QR Code with Logo

## What it does
Generate a QR code from any text or URL entirely in the browser, optionally overlay a logo image in the center, and download the result, with no external API calls involved. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| None | No server-side configuration is required. | n/a |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the QR code with logo generator UI. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- All QR generation runs in the browser using a built-in encoder, so nothing is sent to external services.
- Keep the logo under roughly 30% of the QR width to preserve scannability, and use higher error correction when you need a larger logo area.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="600" frameborder="0"></iframe>
```
