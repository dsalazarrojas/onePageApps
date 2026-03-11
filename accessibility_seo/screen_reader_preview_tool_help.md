# Screen Reader Preview Tool
## What it does
Builds a simplified accessibility tree from a pasted HTML snippet, showing roles, names, and ARIA states as a screen reader would interpret them.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Accessibility tree builder |
| `GET /widget.js` | GET | Iframe injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"></script>
```
## Tips
- Stateless – no bindings required. Processing is entirely client-side.
- Complements real screen reader testing (NVDA, VoiceOver) but does not replace it.
