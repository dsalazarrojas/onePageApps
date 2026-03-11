# Meeting Scheduler Embed

Create bookable time slots and let visitors self-schedule. Bookings stored in KV.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Scheduler UI |
| GET | `/slots?cal=ID` | List slots (with booked status) |
| POST | `/slots` | Add slots |
| POST | `/book` | Book a slot |
| GET | `/bookings?cal=ID` | List all bookings |
| POST | `/cancel` | Cancel a booking |

## POST /slots

```json
{ "cal": "my-cal", "slots": [{"datetime":"2025-06-20T10:00","duration":30,"label":"Discovery call"}] }
```

## POST /book

```json
{ "cal": "my-cal", "slotId": "abc123", "name": "Alice", "email": "alice@example.com" }
```

## Webhook (optional)

Set `WEBHOOK_URL` to receive a POST on each booking.

## KV Binding

```toml
[[kv_namespaces]]
binding = "DATA"
id = "YOUR_KV_ID"
```
