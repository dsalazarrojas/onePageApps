# Fake Data Generator

## What it does
Generate realistic, fully synthetic test records (names, emails, addresses, phone numbers, UUIDs, and more) with one click. All data is randomly constructed client-side — no real people are involved. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| types | Array of field types to generate | ["name","email","phone","address"] |
| count | Number of records to generate (1–100) | 10 |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the data generator UI with field type selector, row count, and CSV/JSON export. |
| POST / | Accepts `{ types, count }` JSON; returns an array of generated records. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Supported field types: `name`, `firstName`, `lastName`, `email`, `phone`, `address`, `city`, `country`, `company`, `jobTitle`, `username`, `password`, `uuid`, `ipv4`, `url`, `color`, `date`, `age`, `creditCard`, `lorem`.
- Maximum 100 records per request. All data is randomly generated — suitable only for testing and demo purposes.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="700" frameborder="0"></iframe>
```
