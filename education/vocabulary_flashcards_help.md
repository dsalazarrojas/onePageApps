# Vocabulary Flashcards

Language learning flashcard widget with KV-backed word lists and progress tracking.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Study UI |
| GET | `/words?lang=NAME` | Get word list |
| POST | `/words` | Add words |
| DELETE | `/words` | Delete word by id |
| POST | `/progress` | Mark known/unknown |
| GET | `/progress?lang=NAME` | Get progress |

## POST /words

```json
{
  "lang": "spanish",
  "words": [{"word": "casa", "definition": "house", "example": "Mi casa es grande."}]
}
```

## KV Binding

```toml
[[kv_namespaces]]
binding = "DATA"
id = "YOUR_KV_ID"
```
