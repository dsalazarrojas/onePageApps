# Base64 File Encoder

## What it does
Encode local files to base64 or decode base64 back into downloadable files without sending data to a server.

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
| GET / | Shows the Base64 File Encoder UI. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Decode mode accepts both raw base64 and full data URIs, but very large payloads can use significant browser memory.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="600" frameborder="0"></iframe>
```
