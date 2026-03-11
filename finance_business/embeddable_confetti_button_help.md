# Embeddable Confetti Button
## What it does
Injects a canvas-based confetti burst that fires when any element matching the configured selector is clicked. Uses zero external dependencies.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Demo + embed builder |
| `GET /widget.js` | GET | Host-page injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"
  data-selector="[data-confetti]"
  data-colors="#ff6b6b,#ffd93d,#6bcb77,#4d96ff"
  data-count="80">
</script>
<!-- Add data-confetti to any button/link: -->
<button data-confetti>🎉 Submit</button>
```
## API
```js
Confetti.burst(x, y);  // programmatic burst at coordinates
Confetti.attach(element);  // attach to any element
```
## Tips
- Stateless – no bindings required.
