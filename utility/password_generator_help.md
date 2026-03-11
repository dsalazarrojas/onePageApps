# Password Generator

## What it does
Generate secure, customizable passwords. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| length | Number of characters to generate for each password. | 16 |
| includeUppercase | Enables uppercase letters in the generated password set. | true |
| includeNumbers | Enables numeric characters in the generated password set. | true |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the password generator UI. |
| POST / | Returns one or more generated passwords plus a strength estimate. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Make sure at least one character class stays enabled or generation will fail validation.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="500" frameborder="0"></iframe>
```
