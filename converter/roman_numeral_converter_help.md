# Roman Numeral Converter

## What it does
Converts Arabic integers from 1 to 3999 into Roman numerals and converts canonical Roman numerals back into integers with live browser-side validation.

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
| GET / | Shows the Roman Numeral Converter UI. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Only canonical numerals from I through MMMCMXCIX are accepted, so non-standard forms such as IIII are intentionally rejected.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="600" frameborder="0"></iframe>
```
