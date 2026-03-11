# Product Search

## What it does
Search products by text, image, or barcode with price comparison. After deployment, it exposes the routes listed below, starting with `GET / or GET /search`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.
- OPENAI_API_KEY for the live AI request this template makes.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| searchQuery | Product name, barcode text, or other search phrase. | Product name or description |
| searchType | Select the search mode used by the product lookup worker. | text, barcode, image |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / or GET /search | Shows the product search UI. |
| POST /api/search | Runs a text or image-assisted product search. |
| POST /api/barcode | Looks up products from a barcode value. |
| POST /api/price-compare | Compares product prices across the supported sources. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Search results are best-effort comparisons and should be double-checked against the merchant page before you act on them.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="500" frameborder="0"></iframe>
```
