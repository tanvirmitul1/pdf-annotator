# API Reference

This document covers how to authenticate and use the PDF Annotator API from external clients (desktop apps, mobile apps, scripts).

## Authentication

The API uses **Bearer token** authentication. You create an API key from your account, then include it in every request.

### Creating an API Key

You must be logged in via the web app to create a key.

```bash
curl -X POST http://localhost:3000/api/api-keys \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=<your-session-cookie>" \
  -d '{"name": "My Desktop App"}'
```

Response:

```json
{
  "id": "clx1abc123",
  "name": "My Desktop App",
  "prefix": "a3f8c1d2",
  "token": "a3f8c1d2e5b7...full-key-here",
  "expiresAt": null,
  "createdAt": "2026-04-29T10:00:00.000Z"
}
```

> **Save the `token` value immediately.** It is shown only once and cannot be retrieved again.

To create a key with an expiry date:

```json
{"name": "Temp Script", "expiresAt": "2026-07-01T00:00:00.000Z"}
```

### Using the API Key

Include the token in the `Authorization` header on every request:

```
Authorization: Bearer <your-api-key>
```

Example:

```bash
curl http://localhost:3000/api/documents \
  -H "Authorization: Bearer a3f8c1d2e5b7...full-key-here"
```

### Managing Keys

**List all keys:**

```bash
GET /api/api-keys
```

Returns `id`, `name`, `prefix`, `lastUsedAt`, `expiresAt`, `revokedAt`, `createdAt`. Never returns the raw token.

**Revoke a key:**

```bash
DELETE /api/api-keys/<id>
```

Revoked keys are immediately rejected on all subsequent requests.

---

## Error Responses

All errors follow the same shape:

```json
{
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Not signed in"
  }
}
```

| Code | HTTP Status | Meaning |
|------|------------|---------|
| `UNAUTHENTICATED` | 401 | Missing, invalid, expired, or revoked API key |
| `FORBIDDEN` | 403 | Authenticated but not authorized for this resource |
| `VALIDATION_FAILED` | 400 | Invalid request body or query parameters |
| `NOT_FOUND` | 404 | Resource does not exist or belongs to another user |
| `RATE_LIMITED` | 429 | Too many requests (check `Retry-After` header) |
| `QUOTA_EXCEEDED` | 402 | Plan limit reached |
| `INTERNAL` | 500 | Server error |

---

## Rate Limits

API key requests are rate-limited per user (not per key):

| Bucket | Limit |
|--------|-------|
| Default | 120 requests/min |
| Auth | 10 requests/min |
| Upload | 20 requests/hour |
| Annotation writes | 300 requests/min |

When rate-limited, the response includes a `Retry-After` header (seconds).

---

## Endpoints

All endpoints accept `Authorization: Bearer <key>` and return JSON.

### Documents

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/documents` | List documents (supports `?sort=`, `?search=`, `?cursor=`, `?limit=`) |
| `GET` | `/api/documents/<id>` | Get a single document |
| `POST` | `/api/documents` | Upload a document (multipart/form-data) |
| `PATCH` | `/api/documents/<id>` | Rename or update a document |
| `DELETE` | `/api/documents/<id>` | Soft-delete a document |

### Annotations

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/annotations?documentId=<id>` | List annotations for a document |
| `POST` | `/api/annotations` | Create an annotation |
| `PATCH` | `/api/annotations/<id>` | Update an annotation |
| `DELETE` | `/api/annotations/<id>` | Soft-delete an annotation |

### Tags

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/tags` | List all tags |
| `POST` | `/api/tags` | Create a tag |

### Comments

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/comments?annotationId=<id>` | List comments on an annotation |
| `POST` | `/api/comments` | Create a comment |

### Notifications

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/notifications` | List notifications |

### Storage

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/storage/<key>` | Download a file by storage key |

### API Keys

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/api-keys` | List your API keys |
| `POST` | `/api/api-keys` | Create a new API key |
| `DELETE` | `/api/api-keys/<id>` | Revoke an API key |

---

## Security Notes

- API keys are hashed (SHA-256) before storage. The raw key exists only in your client.
- Keys can be revoked instantly via `DELETE /api/api-keys/<id>`.
- All requests are audited with the same audit trail as browser sessions.
- Use HTTPS in production. API keys sent over HTTP can be intercepted.
- Store keys securely in your client (OS keychain, encrypted config). Never commit them to source control.
