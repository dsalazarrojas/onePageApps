# API Gateway

## What it does
Create secure API proxies to hide your keys. After deployment, it exposes the routes listed below, starting with `GET / or GET /docs`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.
- PROXY_API_KEY for the upstream service you want to hide from browsers.
- Optional PROXY_ALLOWED_DOMAINS and PROXY_ID values to restrict target hosts and label the proxy instance.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| targetAPI | Upstream API URL you plan to proxy through the worker. | https://api.example.com/endpoint |
| apiKey | Secret API key that the worker hides from clients. | Your API key |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / or GET /docs | Shows the proxy documentation page and usage examples. |
| GET /proxy/{encoded-url} | Forwards a GET request to an allowed upstream URL. |
| POST /proxy/{encoded-url} | Forwards a POST body to an allowed upstream URL while hiding your secret key. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Set `PROXY_ALLOWED_DOMAINS` before public launch so the gateway cannot be abused as an open proxy.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="500" frameborder="0"></iframe>
```
