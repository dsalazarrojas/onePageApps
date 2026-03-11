# Embeddable Flashcard Widget

Create decks and study flashcards with flip animation. Progress tracked in KV.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Flashcard study UI |
| GET | `/decks` | List all deck summaries |
| GET | `/deck?id=ID` | Get full deck with cards |
| POST | `/deck` | Create or update a deck |
| DELETE | `/deck` | Delete deck |
| POST | `/progress` | Record knew/dunno |
| GET | `/progress?deckId=ID` | Get study progress |

## POST /deck (cards format)

```json
{
  "id": "spanish-basics",
  "name": "Spanish Basics",
  "cards": [{"front": "Cat", "back": "Gato"}, {"front": "Dog", "back": "Perro"}]
}
```

## KV Binding

```toml
[[kv_namespaces]]
binding = "DATA"
id = "YOUR_KV_ID"
```
