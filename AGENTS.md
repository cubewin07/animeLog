# anime_log

Personal anime/book journal. The product is not a catalog of titles — it is a place to keep **memories and lessons** from watching and reading. Catalog fields (title, status, progress, rating) exist so each lesson has a home.

This is also a Django learning project. Prefer the Django/DRF way over clever Python or a second backend framework.

## Layout

```
anime_log/
  AGENTS.md              # this file — full-stack / repo-wide
  Backend/               # Django 6.1 + SQLite (see Backend/AGENTS.md)
  Frontend/              # Vite + React + TypeScript SPA (see Frontend/AGENTS.md)
  .grok/agents/          # spawnable agent types: backend, frontend, fullstack
  .grok/skills/          # project skills
```

Before changing a tree, read its `AGENTS.md`. Nested files win on conflict.

## What the models mean

Source of truth: `Backend/animeLog/models.py`.

| Model | Role |
|-------|------|
| `Anime` / `Book` | A title you are logging. `notes` is the lesson/memory. |
| `Rewatch` | A later pass through an anime. First-class because rewatching is how lessons deepen. |
| `FavoriteCharacter` | A character worth remembering. `why` is the lesson. |
| `Genre` | Shared tag across anime and books. |
| `Studio` | Anime-only production studio. |

Do not add quote/highlight/tag models unless asked. Extend the existing ones.

## Agent routing

| Work | Agent |
|------|--------|
| Models, admin, migrations, DRF, tests under `Backend/` | `backend` |
| UI, Vite/React, client API, styling under `Frontend/` | `frontend` |
| Features that need both, API contract, CORS, end-to-end | `fullstack` |

Spawn `backend` / `frontend` for independent slices. Keep contract work (serializer shape, status enums, URL paths) on the parent or `fullstack` so the two sides do not drift.

## Stack decisions (locked)

- Backend: Django 6.1, app `animeLog`, SQLite, Django admin, **Django REST Framework** for the JSON API.
- Frontend: **Vite + React + TypeScript**. Not Next.js, not Django templates, not HTMX.
- API JSON: DRF serializer output. Do **not** wrap in a JSON:API `{ data: { type, attributes } }` envelope (the `rest-api-design` skill suggests that; this repo overrides it).
- API prefix: `/api/` with no version segment until a breaking change actually needs one.

## Learning mode

- Teach in the chat reply or commit message, not in code comments.
- Introduce one new Django concept per change when possible (migrations, QuerySets, serializers, viewsets, permissions).
- Use Context7 (`/context7`) for Django 6.1 / DRF / React docs. Do not guess APIs from older Django.

## Cross-cutting rules

- Python 3.14, venv at `Backend/.venv`. Deps file is `Backend/requirement.txt` (filename is a typo; do not rename unless asked).
- Keep `AnimeStatus` / `BookStatus` values identical on the frontend.
- Rating is 1–10 or null. Progress is a count (episodes or pages), not a percentage.
- CORS is required once the SPA talks to Django; configure it in Django, not by disabling the browser.
- Do not commit `.venv`, `__pycache__`, `node_modules`, or `db.sqlite3` going forward.
- Do not treat the checked-in `SECRET_KEY` as production-ready.

## Skills

| Skill | When |
|-------|------|
| `django-backend` | Models, migrations, admin, DRF, Django tests |
| `rest-api-design` | Resource URLs, methods, status codes (ignore its JSON:API envelope) |
| `frontend-design` | New screens or visual identity |
| `vercel-react-best-practices` | React code (SPA subset only — skip Next.js/RSC rules) |
| `web-design-guidelines` | UI/accessibility review |
| `webapp-testing` | Browser verification of local UI |
| `context7` | Current library docs |
