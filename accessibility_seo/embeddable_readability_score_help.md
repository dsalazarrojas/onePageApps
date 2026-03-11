# Embeddable Readability Score
## What it does
Calculates the Flesch Reading Ease score and grade level for pasted text. Entirely client-side calculation within the embedded iframe.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Readability analyser UI |
| `GET /widget.js` | GET | Iframe injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"></script>
```
## Tips
- Score 0–100: higher = easier to read.
- Stateless – no bindings required. No text is sent to the server.
