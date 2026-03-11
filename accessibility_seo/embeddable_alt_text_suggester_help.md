# Embeddable Alt Text Suggester

## What it does
Renders an embeddable widget that accepts an uploaded image or remote asset URL, then calls an OpenAI-compatible vision endpoint to suggest accessible alt text.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.
- `OPENAI_API_KEY` for the live AI request.
- Optional `OPENAI_BASE_URL`, `OPENAI_MODEL`, or `MODEL` values when you use an OpenAI-compatible provider other than OpenAI.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| `MODEL` | Vision-capable model identifier used for the request. | `gpt-4o-mini` |
| `OPENAI_BASE_URL` | Base URL for an OpenAI-compatible provider. | `https://api.openai.com/v1` |
| `OPENAI_MODEL` | Alternate model secret if you prefer that naming. | `gpt-4o-mini` |

## Live app endpoints
| Path | What it does |
|------|-------------|
| `GET /` | Serves the embeddable image upload and alt text UI. |
| `POST /suggest` | Accepts multipart form data or JSON and returns `{ altText, style, model }`. |
| `GET /health` | Returns whether the worker currently has AI credentials. |

## Tips & limits
- Use a **vision-capable** model; text-only chat models will return poor or empty results.
- Remote image URLs must be publicly reachable by the AI provider if you use the URL path instead of uploading the file directly.
- Keep the widget’s suggestions in editorial review for brand-sensitive or compliance-heavy content.
- Decorative assets should stay brief—tell users to select the decorative style when the image adds little semantic meaning.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="780" frameborder="0"></iframe>
```
