# Cooking Unit Converter

## What it does
Converts common cooking volume, weight, and temperature units in the browser and includes quick-reference kitchen conversion chips for everyday recipe work.

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
| GET / | Shows the cooking unit converter UI. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Weight and volume are kept separate on purpose, because ingredient density changes how flour, sugar, and liquids compare.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="600" frameborder="0"></iframe>
```
