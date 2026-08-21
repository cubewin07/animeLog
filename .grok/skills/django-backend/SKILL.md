---
name: django-backend
description: >
  Django 6.1 conventions for the anime_log backend: models, migrations, admin,
  DRF API, CORS, and tests. Use when changing Backend/, adding serializers or
  viewsets, writing migrations, or when the user asks for Django/DRF work
  on this journal app. Use with /django-backend.
---

# Django backend (anime_log)

Work in `Backend/`. Activate `Backend/.venv`. Settings: `config.settings`. App label: `animeLog`.

Look up Django 6.1 / DRF with the `context7` skill. Do not copy Django 3/4 snippets from memory.

## Order of work

1. Read `Backend/AGENTS.md` and `animeLog/models.py`.
2. Change the model (or serializer) first. Journal fields (`notes`, `why`) stay on the payload.
3. `python manage.py makemigrations && python manage.py migrate`
4. Wire admin if a new model should be editable there (inlines for children of `Anime`).
5. For HTTP: serializer → viewset → `animeLog/urls.py` included at `/api/` from `config/urls.py`.
6. `python manage.py test`

## API

- DRF, not Django Ninja, not hand-rolled `JsonResponse` for resource CRUD.
- Plain serializer JSON. No `{ data: { type, attributes } }` envelope.
- Prefetch `genres`, `studios`, `favorite_characters`, `rewatches` on anime list/detail.
- Add `django-cors-headers` when the Vite app needs it. Allow the Vite origin only.

## Tests

`django.test.TestCase` or DRF `APITestCase`. Assert status enums, rating bounds, nested creates, and list query counts when prefetch is added.

## Teaching

In the reply, name the Django concept you used (migration, `prefetch_related`, `ModelViewSet`, …) in one or two sentences. No tutorial comments in code.
