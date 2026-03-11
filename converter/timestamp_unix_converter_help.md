# Unix Timestamp Converter

## What it does
Converts Unix timestamps in seconds or milliseconds to human-readable date formats and converts local date/time input back into Unix timestamps in the browser.

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
| GET / | Shows the Unix Timestamp Converter UI. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- The UI auto-detects milliseconds for large values, so 13-digit timestamps are treated as milliseconds instead of seconds.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="600" frameborder="0"></iframe>
```
