# ASCII Art Live Editor
## What it does
Converts text to ASCII art in Block, Banner, or Slant styles using a built-in character map. Includes one-click copy.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | ASCII art generator |
| `GET /widget.js` | GET | Iframe injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"></script>
```
## Tips
- Stateless – no bindings required. Supports A–Z, 0–9, space, ! and ?.
