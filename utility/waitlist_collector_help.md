# Waitlist & Email Collector

## What it does
A landing page that captures emails, sends a welcome email via Resend, and notifies you of new signups. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.
- WAITLIST KV binding for subscriber storage and admin export.
- ADMIN_PASSWORD_HASH before sharing the admin route.
- Optional RESEND_API_KEY, FROM_EMAIL, and WEBHOOK_URL values for notifications.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| HEADLINE | Hero headline shown on the waitlist landing page. | We're launching soon |
| SUBHEADLINE | Supporting text shown under the waitlist headline. | Be the first to know when we go live. |
| CTA_LABEL | Button text used on the waitlist form. | Join the Waitlist |
| COLLECT_NAME | When enabled, the waitlist form also asks for a name. | true |
| FROM_EMAIL | Verified sender address used for outbound emails. | hello@yourdomain.com |
| FROM_NAME | Friendly sender name shown in outbound emails. | Your Company |
| WELCOME_SUBJECT | Subject line used for the welcome email. | You're on the list! |
| WELCOME_BODY_HTML | HTML body used for the welcome email. | <p>Thanks for joining! We'll be in touch.</p> |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the waitlist landing page. |
| POST /join | Stores a signup and optionally sends notifications. |
| GET /admin | Shows the password-protected admin dashboard. |
| GET /admin/export.csv | Exports saved signups as CSV. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- KV-backed templates should also account for free-tier read/write quotas and eventual consistency on repeated reads.
- Welcome emails only send when the sender address is verified with Resend and the API key is valid.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="500" frameborder="0"></iframe>
```
