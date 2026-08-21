# Backend

Django 6.1 project. Settings module: `config.settings`. Single app: `animeLog` (camelCase — keep it; do not rename).

## Commands

Run from `Backend/` with `.venv` active (`source .venv/bin/activate`).

| Command | What |
|---------|------|
| `python manage.py runserver` | Dev server, http://127.0.0.1:8000/ |
| `python manage.py test` | App tests |
| `python manage.py makemigrations` | After model changes |
| `python manage.py migrate` | Apply migrations |
| `python manage.py createsuperuser` | Admin login |
| `.venv/bin/pip install -r requirement.txt` | Install deps |

Admin: http://127.0.0.1:8000/admin/

## Current state

Shipped: models, initial migration, admin (inlines for rewatches and favorite characters).

Not shipped: views, URLs besides admin, DRF, CORS, tests (stub only).

## Domain rules

`animeLog/models.py` is the schema. Match it.

- `notes` on `Anime`/`Book`/`Rewatch` and `why` on `FavoriteCharacter` are the journal. Do not drop or hide them on the API.
- `Genre` is shared (`related_name="anime"` / `"books"`). `Studio` is anime-only.
- Status enums stay as `TextChoices` with the current values (`WATCHING`, `PLAN_TO_WATCH`, …).
- Nested writes: creating an anime may include genres, studios, favorite characters. Rewatches are added after the anime exists.
- Prefer `select_related` / `prefetch_related` on list endpoints (anime → genres, studios, characters, rewatches).

## How to grow the API

When adding HTTP:

1. Add `djangorestframework` (and `django-cors-headers` once the SPA exists) to `requirement.txt`, then `INSTALLED_APPS`.
2. Model → serializer → viewset/APIView → `animeLog/urls.py` included from `config/urls.py` under `/api/`.
3. Use DRF default JSON (plain objects / lists). Pagination via DRF page number or limit/offset.
4. Keep Django admin working. It is the data-entry UI until the SPA covers the same flows.

Resources to expose (nouns, plural):

```
/api/genres
/api/studios
/api/anime
/api/anime/{id}/rewatches
/api/anime/{id}/favorite-characters
/api/books
```

Follow the `rest-api-design` skill for methods and status codes. Do not use its `{ data: { type, attributes } }` envelope.

## Code style

- Django coding style: 4-space indent, `Model.objects`, explicit `related_name`.
- Validation on the model (already: rating 1–10). Mirror it on serializers; do not rely on the client.
- Business rules that need two fields (e.g. `progress` vs `total_episodes`) belong on the model or a small service module, not in the view.
- Fat models / thin views. No Celery, Channels, or Django Ninja unless asked.

## Tests

Use `django.test.TestCase` / `APITestCase` in `animeLog/tests.py` or `animeLog/tests/`. Cover:

- Status and rating constraints
- Nested rewatch / favorite-character relations
- List/create/update API once it exists

## Gotchas

- Filename is `requirement.txt`, not `requirements.txt`.
- `AnimelogConfig.name` is `'animeLog'` — imports and `INSTALLED_APPS` must match.
- SQLite file `db.sqlite3` is local data. Do not delete it to "fix" migrations; make a new migration instead.
- Django 6.1: look up current docs with Context7. Do not copy Django 3/4 settings blindly (`MAILERS` is already a 6.x setting).
- `SECRET_KEY` in `settings.py` is the startproject default. Fine for local learning; never deploy it.
