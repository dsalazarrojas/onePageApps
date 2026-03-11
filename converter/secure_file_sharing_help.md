# Secure File Sharing

## What it does
Share files securely with password protection. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.
- FILE_R2 bucket binding for uploaded file storage.
- FILE_KV binding for metadata, expiry tracking, and optional password checks.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| fileName | Display name shown for the shared file. | document.pdf |
| password | Optional password required before a file can be downloaded. | Leave empty for no password |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the upload page. |
| POST /upload | Uploads a file and returns the share URL plus metadata. |
| GET /download/{fileId} | Downloads the stored file and enforces the optional password. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- KV-backed templates should also account for free-tier read/write quotas and eventual consistency on repeated reads.
- Use short expiry windows for sensitive files because this template is designed for lightweight sharing, not long-term records management.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="500" frameborder="0"></iframe>
```
