# Testimonial Carousel Embed

KV-backed rotating testimonial carousel. Add/manage testimonials via API or the built-in UI.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Carousel UI |
| GET | `/testimonials` | List all testimonials |
| POST | `/testimonials` | Add a testimonial |
| DELETE | `/testimonials` | Delete by id |

## POST /testimonials

```json
{ "author": "Jane Doe", "role": "CEO at Acme", "text": "This product changed everything." }
```

## KV Binding

```toml
[[kv_namespaces]]
binding = "DATA"
id = "YOUR_KV_ID"
```

Embed the `/` page in an `<iframe>` or use the JSON API with your own carousel.
