# Transcription App

## What it does
Convert audio files to text with AI. After deployment, the main live route is `POST /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.
- OPENAI_API_KEY for the live AI request this template makes.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| audioData | Base64-encoded audio payload sent for transcription. | Upload audio file |
| format | Audio format the transcription request uses. | mp3, wav, m4a |

## Live app endpoints
| Path | What it does |
|------|-------------|
| POST / | Accepts audio data and returns a transcript. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Long recordings and large uploads increase latency and may hit provider-side upload limits.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="500" frameborder="0"></iframe>
```
