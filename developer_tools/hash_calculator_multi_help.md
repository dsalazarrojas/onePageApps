# Hash Calculator Multi

## What it does
Calculate MD5, SHA-1, SHA-256, SHA-384, and SHA-512 hashes for pasted text or uploaded files directly in the browser.

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
| GET / | Shows the Hash Calculator Multi UI. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Large files are processed entirely in the browser, so hashing very large uploads may feel slower on low-powered devices.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="600" frameborder="0"></iframe>
```
