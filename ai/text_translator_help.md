# Text Translator

## What it does
Translate text between languages with AI. After deployment, the main live route is `POST /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.
- OPENAI_API_KEY for the live AI request this template makes.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| text | Main text input sent to the worker. | Enter text here... |
| targetLanguage | Language the translated output should use. | Spanish, French, German... |

## Live app endpoints
| Path | What it does |
|------|-------------|
| POST / | Accepts text plus target language and returns `translatedText`. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Very short fragments can confuse source-language detection, so specify the intended language clearly in the input when needed.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="500" frameborder="0"></iframe>
```
