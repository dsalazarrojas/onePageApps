# Unit Converter

## What it does
Converts values across common length, weight, temperature, volume, area, and speed units in a polished browser-based interface with all math handled client-side.

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
| GET / | Serves the interactive unit converter page with category-based unit selection and instant browser-side calculations. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Temperature conversions use formulas rather than ratios, so verify the selected category before comparing results.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="600" frameborder="0"></iframe>
```
