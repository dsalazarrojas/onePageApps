# Color Converter

## What it does
Converts colors between HEX, RGB, HSL, and HSV with a live swatch preview, browser-side formulas, and copy-ready CSS-friendly outputs.

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
| GET / | Serves the live color conversion app with picker input, synchronized format fields, and copy buttons. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- HSV is shown for design workflows, but the CSS preview string uses RGB because HSV is not a native CSS color syntax.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="600" frameborder="0"></iframe>
```
