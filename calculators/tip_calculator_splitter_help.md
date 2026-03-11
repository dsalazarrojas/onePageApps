# Tip Calculator & Bill Splitter

## What it does
Calculate the tip on any bill and split the total evenly across any number of people. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| billAmount | Pre-tip bill total | 85.00 |
| tipPercent | Tip percentage to apply | 18 |
| people | Number of people splitting the bill | 4 |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the interactive tip calculator UI with quick-select buttons and a range slider. |
| POST / | Accepts `{ billAmount, tipPercent, people, roundUp }` JSON; returns tip amount, total, and per-person share. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Set `roundUp: true` in the POST body to round each person's share up to the nearest cent.
- Tip percentage range in the UI is 0–50%; the API accepts any non-negative number.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="560" frameborder="0"></iframe>
```
