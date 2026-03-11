# Cron Expression Tester

## What it does
Parse 5-field or 6-field cron expressions, explain them in plain English, and preview the next 10 run times directly in the browser.

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
| GET / | Shows the Cron Expression Tester UI. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- When both day-of-month and day-of-week are restricted, this tool uses standard cron OR-style matching to find run times.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="600" frameborder="0"></iframe>
```
