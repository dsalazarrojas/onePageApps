# URL Status Checker

## What it does
Check website availability from multiple regions. After deployment, the main live route is `POST /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| url | Target URL the worker checks or scrapes. | https://example.com |

## Live app endpoints
| Path | What it does |
|------|-------------|
| POST / | Checks the target URL from multiple regions and returns per-region status data. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- The worker uses lightweight network checks, so a passing status does not always match a full browser rendering test.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="500" frameborder="0"></iframe>
```
