# CSV ↔ JSON Converter

## What it does
Converts CSV to JSON and JSON back to CSV in the browser, including header rows, quoted fields, and comma-containing values.

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
| GET / | Serves the dual-panel CSV and JSON conversion page with row and column counts plus copy actions. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Nested JSON values are stringified into CSV cells, so flatten complex records if you need spreadsheet-friendly columns.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="600" frameborder="0"></iframe>
```
