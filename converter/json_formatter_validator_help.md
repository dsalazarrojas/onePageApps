# JSON Formatter & Validator

## What it does
Formats, minifies, validates, and colorizes JSON directly in the browser while also reporting key count, nesting depth, and payload size.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
No configuration fields required.

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Serves the JSON formatter and validator page with syntax-colored preview and inline validation feedback. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Very large JSON blobs can still render slowly in the browser because formatting and syntax highlighting happen entirely client-side.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="600" frameborder="0"></iframe>
```
