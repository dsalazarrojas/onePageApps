# Email Draft Assistant

## What it does
Draft professional emails from brief prompts. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.
- OPENAI_API_KEY for the live AI request this template makes.
- OPENAI_API_KEY for drafting and subject-line generation.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| recipient | Recipient name or email address for the generated draft. | colleague@company.com |
| goal | What the generated email should accomplish. | What do you want to achieve with this email? |
| tone | Tone or style the generated draft should follow. | professional, casual, formal |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows a browser UI for drafting an email. |
| POST / | Returns a generated subject line and email draft. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Review tone, claims, and recipient details before sending the generated draft.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="500" frameborder="0"></iframe>
```
