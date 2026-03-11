# JSON ↔ YAML Converter

## What it does
Converts JSON to YAML and YAML back to JSON in the browser using a lightweight serializer and parser for nested objects, arrays, strings, numbers, booleans, and null values.

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
| GET / | Serves the side-by-side JSON and YAML conversion page with inline parsing errors and copy actions. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- The YAML parser intentionally supports a lightweight subset, so keep indentation consistent and use quotes for strings with special characters.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="600" frameborder="0"></iframe>
```
