# AI Ad Copy Generator

## What it does
Create compelling ad copy variations for products. After deployment, the main live route is `POST /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.
- OPENAI_API_KEY for the live AI request this template makes.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| productName | Name of the product or offer featured in the output. | Acme Widget |
| description | Core product details used to generate the copy. | Describe your product... |
| platform | Optional publishing channel that changes tone and format. | social media, search ads, display ads... |

## Live app endpoints
| Path | What it does |
|------|-------------|
| POST / | Accepts product details and returns multiple ad-copy angles. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Review generated claims before publishing, especially for regulated products or paid ads.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="500" frameborder="0"></iframe>
```
