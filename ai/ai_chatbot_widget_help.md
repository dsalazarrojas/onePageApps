# AI Chatbot Widget

## What it does
Deploy an embeddable AI assistant powered by any LLM. Visitors chat directly on your page. After deployment, it exposes the routes listed below, starting with `GET /`.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.
- OPENAI_API_KEY plus optional OPENAI_BASE_URL and MODEL values for the chatbot backend.
- Optional CHAT_HISTORY KV binding if you want 24-hour server-side conversation history.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| WIDGET_TITLE | Widget title shown in the chatbot preview and launcher. | Ask me anything |
| SYSTEM_PROMPT | System instructions that define the chatbot persona. | You are a helpful assistant... |
| MODEL | OpenAI-compatible model name used for responses. | llama-3.1-8b-instant |
| WIDGET_ACCENT_COLOR | Hex accent color applied to the widget UI. | #6366F1 |

## Live app endpoints
| Path | What it does |
|------|-------------|
| GET / | Shows the embeddable chatbot preview page. |
| POST /chat | Accepts a chat turn and returns the assistant reply plus session metadata. |
| GET /reset?sessionId=... | Clears saved history for a session when KV storage is enabled. |

## Tips & limits
- Cloudflare Workers free tier: plan around request quotas and tight per-request CPU budgets on the free plan.
- Without `CHAT_HISTORY`, conversations stay in the browser only; with KV bound, the worker keeps about 24 hours of server-side history.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="500" frameborder="0"></iframe>
```
