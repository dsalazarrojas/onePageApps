# Web Scraper

## What it does
Extract data from websites using CSS selectors. After deployment, the main live route is `POST /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| url | Target URL the worker checks or scrapes. | https://example.com |
| selectors | Comma-separated CSS selectors to extract from the fetched page. | title, description, price |

## Live app endpoints
| Path | What it does |
|------|-------------|
| POST / | Fetches the target page and extracts content for the supplied CSS selectors. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- This scraper works best on server-rendered HTML; heavily client-rendered sites may return incomplete data.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="500" frameborder="0"></iframe>
```
