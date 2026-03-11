# Language Practice Widget

## What it does
Creates a lightweight speaking practice widget that generates one short exercise at a time with an OpenAI-compatible chat model, then optionally reads the phrase aloud through the `/audio/speech` endpoint.

## What you need
- Cloudflare API Token to deploy and update the worker from the app.
- Cloudflare Account ID for the Workers account that will host the app.
- `OPENAI_API_KEY` for both the chat prompt and text-to-speech requests.
- Optional `OPENAI_BASE_URL`, `MODEL`, `TTS_MODEL`, and `TTS_VOICE` secrets.

## Configuration fields
| Field | Description | Example |
|-------|-------------|---------|
| `MODEL` | Chat model used to generate the practice card. | `gpt-4o-mini` |
| `TTS_MODEL` | Text-to-speech model used by `POST /speak`. | `tts-1` |
| `TTS_VOICE` | Default voice for pronunciation playback. | `alloy` |
| `DEFAULT_TARGET_LANGUAGE` | Language shown in the target language field on first load. | `Spanish` |
| `DEFAULT_NATIVE_LANGUAGE` | Native-language default shown on first load. | `English` |

## Live app endpoints
| Path | What it does |
|------|-------------|
| `GET /` | Serves the embeddable language practice page. |
| `POST /practice` | Returns a short practice JSON object with phrase, translation, pronunciation, and coaching text. |
| `POST /speak` | Streams MP3 audio for the phrase using an OpenAI-compatible speech endpoint. |
| `GET /health` | Returns whether the worker currently has AI credentials. |

## Tips & limits
- `/speak` assumes your configured provider supports the OpenAI-compatible **`/audio/speech`** endpoint. If it does not, the worker returns a clear 502 error instead of pretending speech succeeded.
- Keep prompts short; this template is designed for quick drills, not long-form tutoring or stateful curriculum tracking.
- Browser autoplay restrictions usually require the learner to click the “Listen” button before audio can play.
- If you want persistent progress, add your own storage layer later; this worker intentionally keeps state in the browser only.

## Example embed code
```html
<iframe src="https://your-worker.workers.dev" width="100%" height="760" frameborder="0"></iframe>
```
