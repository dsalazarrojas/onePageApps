# Password Strength Visualizer

## What it does
Analyse any password in real time and display a visual strength meter, entropy estimate, crack-time forecast, and a per-rule checklist covering length, character classes, repeated characters, sequential patterns, and common password detection. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| password | The password string to analyse | Tr0ub4dor&3 |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the password strength UI with live-updating meter, entropy bar, and rule checklist. |
| POST / | Accepts `{ password }` JSON; returns score (0–100), label, colour, entropy (bits), crack-time estimate, and per-rule checks. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Crack time is estimated at 1 billion guesses per second (offline attack scenario) and is intentionally approximate.
- The common-password check covers the most-used 30+ passwords. It is not exhaustive.
- No passwords are logged or stored; the worker processes them in memory and discards immediately.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="600" frameborder="0"></iframe>
```
