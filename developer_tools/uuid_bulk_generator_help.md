# UUID Bulk Generator

## What it does
Generate up to 1,000 UUID v4 values at a time with multiple output formats plus optional prefixes and suffixes.

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
| GET / | Shows the UUID Bulk Generator UI. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- If downstream systems expect strict UUID formatting, avoid adding prefixes, suffixes, braces, or uppercase transformations.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="600" frameborder="0"></iframe>
```
