# Public API v1

The public API is a read-only integration surface for external clients. It is
separate from the signed-in application API and never returns passwords, email
addresses, private events, memberships or chat messages. Groups themselves are
public in the MVP; event visibility is still respected.

## Authentication

Every request must include a valid key in the `X-API-Key` header:

```bash
curl \
  -H "X-API-Key: tr_pub_<issued-key>" \
  http://localhost:8000/api/public/v1/groups/
```

Keys are issued by an administrator:

```bash
python manage.py create_public_api_key --name "partner integration"
```

The raw key is printed once. The database stores only a salted Django password
hash. Keys can be revoked in Django admin. The default limits are 60 requests per minute
per key and 120 requests per minute per source IP; change them with
`PUBLIC_API_RATE` and `PUBLIC_API_IP_RATE`.

## Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/public/v1/health/` | API availability and version |
| GET | `/api/public/v1/sports/` | Supported sports catalog |
| GET | `/api/public/v1/districts/` | Vienna district catalog |
| GET | `/api/public/v1/events/` | Public events, filters and pagination |
| GET | `/api/public/v1/events/{id}/` | One public event |
| GET | `/api/public/v1/groups/` | Public groups, filters and pagination |
| GET | `/api/public/v1/groups/{id}/` | One public group |
| GET | `/api/public/v1/users/` | Public profiles, search and pagination |
| GET | `/api/public/v1/users/{id}/` | One public profile |

The OpenAPI schema and interactive Swagger UI are available at
`/api/schema/` and `/api/docs/`. Swagger exposes the `PublicApiKeyAuth` scheme,
so a consumer can click **Authorize**, enter the key, and try the endpoints.

List endpoints support `page`, `page_size` (maximum 100), `search` where
appropriate, and documented filtering/sorting query parameters.
