# Live Regex Tester

## What it does
Lets you test regular expressions live in the browser with highlighted matches, capture group output, flag toggles, and a compact regex cheat sheet.

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
| GET / | Shows the live regex tester UI. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Match highlighting is rendered in a separate preview layer, so extremely large pasted documents may feel heavy in slower browsers.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="600" frameborder="0"></iframe>
```
