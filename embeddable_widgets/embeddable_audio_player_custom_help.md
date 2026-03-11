# Embeddable Audio Player (Custom)
## What it does
A minimal, dark-themed HTML5 audio player embed. Supports any direct audio URL (MP3, OGG, WAV), volume control, seek bar, and play/pause.
## Endpoints
| Path | Method | Description |
|------|--------|-------------|
| `GET /` | GET | Audio player UI |
| `GET /widget.js` | GET | Iframe injector |
## Embed
```html
<script src="https://your-worker.workers.dev/widget.js"></script>
```
## Tips
- Stateless – no bindings required.
- Audio URLs must be accessible with CORS headers for cross-origin playback.
