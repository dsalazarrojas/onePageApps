# Headline Generator

## What it does
Create compelling headlines from brief descriptions. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.
- OPENAI_API_KEY for the live AI request this template makes.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| brief | Short description of the story, campaign, or page the worker should cover. | Describe your content topic... |
| keywords | Optional keywords the worker should try to include. | Relevant keywords separated by commas |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the headline generator UI. |
| POST / | Returns generated headline options and explanations as JSON. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Optional keywords help with SEO or campaigns, but too many can make headlines read unnaturally.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="500" frameborder="0"></iframe>
```
