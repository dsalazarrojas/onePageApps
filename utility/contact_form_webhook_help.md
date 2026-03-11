# Contact Form Forwarder

## What it does
A customizable contact form that emails you results and posts to Slack, Discord, or any webhook. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.
- SUBMISSIONS KV binding if you want saved submissions and CSV export.
- RESULTS_PASSWORD_HASH before exposing `/results` to anyone.
- Optional RESEND_API_KEY, NOTIFICATION_EMAIL, and WEBHOOK_URL values for alerts.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| FORM_TITLE | Heading displayed on the public form. | Contact Us |
| SUBMIT_BUTTON_LABEL | Label shown on the form submit button. | Send Message |
| THANK_YOU_MESSAGE | Confirmation text shown after a successful submit. | Thanks! We'll be in touch soon. |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the public contact form. |
| POST /submit | Accepts a form or JSON submission and triggers storage/notifications. |
| GET /results | Shows password-protected results. |
| GET /results.csv | Exports saved submissions as CSV. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- KV-backed templates should also account for free-tier read/write quotas and eventual consistency on repeated reads.
- Set `RESULTS_PASSWORD_HASH` before sharing `/results`, because the worker exposes stored submissions there.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="500" frameborder="0"></iframe>
```
