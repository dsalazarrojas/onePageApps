# Encode / Decode Tool

## What it does
Encode and decode text using base64, base64url, hex, URL encoding, uuencode, and common formats. After deployment, the main live route is `POST /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| input | Raw text the worker will encode or decode. | Text to encode or decode... |
| action | Choose whether to encode or decode the input. | encode or decode |
| format | Encoding format used for the conversion. | Select encoding format |

## Live app endpoints
| Path | What it does |
|------|-------------|
| POST / | Encodes or decodes the supplied input using the selected format. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Decode operations fail on malformed input, so copy/paste exact values when testing round trips.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="500" frameborder="0"></iframe>
```
