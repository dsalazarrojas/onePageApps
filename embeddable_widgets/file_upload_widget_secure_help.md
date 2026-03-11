# File Upload Widget (Secure)

## What it does
Provides an embeddable upload page backed by Cloudflare Workers, R2, and KV. Visitors upload a file, receive a time-limited download link, and can optionally protect the download with a password.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.
- `FILE_R2` bucket binding for the uploaded file binaries.
- `FILE_KV` KV binding for metadata, expiry tracking, and password hashes.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| `MAX_FILE_SIZE_MB` | Maximum upload size accepted by the widget. | `25` |
| `DEFAULT_EXPIRY_HOURS` | Default expiry window shown in the UI. | `24` |
| `ALLOWED_FILE_TYPES` | Optional comma-separated extensions or MIME types. | `.pdf,image/*` |
| `REQUIRE_PASSWORD` | When `true`, the browser must provide a password on every upload. | `true` |
| `UPLOAD_TITLE` | Optional title shown on the upload page. | `Client delivery drop` |

## Live app endpoints
| Path | What it does |
|------|-------------|
| `GET /` | Renders the upload experience and copyable download link UI. |
| `POST /upload` | Accepts multipart form uploads and stores the file in R2 plus metadata in KV. |
| `GET /download/{id}` | Downloads the file and enforces expiry plus optional password checks. |
| `GET /api/uploads/{id}` | Returns lightweight metadata for the uploaded file. |
| `GET /health` | Confirms whether the required bindings are present. |

## Tips & limits
- The deployment runtime must provision **both** `FILE_R2` and `FILE_KV`. Without those bindings the page loads, but uploads cannot be persisted.
- Password protection currently gates downloads with a SHA-256 password hash. It does **not** encrypt the object contents inside R2.
- Expired files are deleted lazily when they are requested after expiry, so pair this with bucket lifecycle rules if you need aggressive cleanup.
- Large files are still subject to Worker body-size and request-duration limits.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="760" frameborder="0"></iframe>
```
