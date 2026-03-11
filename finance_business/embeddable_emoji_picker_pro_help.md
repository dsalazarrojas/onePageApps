# Embeddable Emoji Picker Pro
## What it does
A floating emoji picker that communicates with the host page via `postMessage`. Can auto-attach to any text input, tracks recently used emojis in `localStorage`.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Emoji picker (iframe content) |
| `GET /widget.js` | GET | Host-page injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"
  data-target="#my-input">
</script>
<!-- Or open programmatically: -->
<script>EmojiPicker.open(x, y);</script>
```
## Events
```js
document.addEventListener('emojiPicked', e => console.log(e.detail.emoji));
```
## Tips
- Stateless – no bindings required.
