# Age Calculator (Exact)

## What it does
Calculate a person's exact age broken down into years, months, days, total weeks, hours, and minutes. Also shows the next birthday countdown, zodiac sign, and Chinese zodiac animal. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| birthdate | Date of birth in ISO 8601 format | 1990-06-15 |
| targetDate | Date to calculate age as of (defaults to today) | 2025-01-01 |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the age calculator UI with birth date and target date pickers. |
| POST / | Accepts `{ birthdate, targetDate? }` JSON; returns exact age breakdown, zodiac sign, Chinese zodiac, and next-birthday countdown. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- `targetDate` is optional; when omitted the worker uses the current UTC date at request time.
- Dates must be in `YYYY-MM-DD` format. Dates in the future relative to `targetDate` are rejected.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="700" frameborder="0"></iframe>
```
