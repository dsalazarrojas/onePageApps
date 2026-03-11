# Loan EMI Calculator

## What it does
Calculate monthly EMI (Equated Monthly Instalment) for any loan and display a full amortization schedule. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| principal | Loan amount in your chosen currency | 500000 |
| annualRate | Annual interest rate as a percentage | 8.5 |
| tenureMonths | Loan tenure in months | 240 |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the EMI calculator UI with amortization table and pie chart. |
| POST / | Accepts `{ principal, annualRate, tenureMonths }` JSON; returns EMI, total payment, total interest, and full monthly schedule. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Zero interest rate (0%) is supported — it divides principal evenly across months.
- Amortization schedule is capped at the requested tenure; floating-point rounding on the last row is corrected automatically.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="700" frameborder="0"></iframe>
```
