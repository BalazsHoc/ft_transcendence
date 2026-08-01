# Sports catalog

`GET /api/meta/sports/` is public and returns the canonical list of 20 sport
codes, for example:

```json
[
  {"code": "running"},
  {"code": "table_tennis"}
]
```

Event and group `sport` fields validate against this catalog. Clients must store
and submit the `code`; visible labels are translated on the frontend using the
`sports.<code>` i18n key. An empty sport filter means all sports.
