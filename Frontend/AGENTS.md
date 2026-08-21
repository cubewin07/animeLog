# Frontend

SPA for the personal anime/book journal. Empty folder today — scaffold here, not inside Django templates.

## Intended stack (locked)

Vite + React + TypeScript. Talks to the Django API at `/api/`.

Not Next.js, not Vue, not Django templates. Skip Next.js/RSC rules in `vercel-react-best-practices`; keep client, re-render, and bundle rules that apply to a Vite SPA.

## Commands (after scaffold)

Run from `Frontend/`.

| Command | What |
|---------|------|
| `npm install` | Install deps |
| `npm run dev` | Vite dev server (proxy `/api` to Django `:8000`) |
| `npm run build` | Production build |
| `npm run lint` | Lint if configured |
| `npm test` | Unit tests if configured |

Proxy `/api` in `vite.config.ts` to `http://127.0.0.1:8000` so the browser stays same-origin during dev.

## Product

The UI is a **journal**, not MyAnimeList.

- A title row without `notes` / `why` is incomplete. Make writing the lesson easy, not buried behind a tiny icon.
- Surfaces that matter: currently watching/reading, completed with lessons, plan-to-watch/read, rewatches, favorite characters.
- Status values must match `AnimeStatus` / `BookStatus` in `Backend/animeLog/models.py`.
- Rating is 1–10 or empty. Progress is episode/page count vs optional total.

## Visual direction

Use the `frontend-design` skill. Derive the look from the subject (personal media journal, paper notes, stills, spines) — not a generic dark dashboard with purple gradients.

After building a screen, run `web-design-guidelines` and verify in the browser (`webapp-testing` or equivalent): create, edit, empty, error, desktop and mobile.

## Talking to Django

- Types for API payloads live in the frontend and must follow DRF JSON (plain objects). Do not invent a `{ data: { attributes } }` wrapper.
- Shared enums (status strings, rating range) stay in sync with the backend models. If you need a new status, change the Django `TextChoices` first.
- Do not call SQLite or import Python. The API is the contract.
- Loading / empty / error states are required on every list and form.

## Code style

- Functional components, TypeScript strict.
- Colocate component + styles. No giant `utils.ts` dumping ground.
- Fetch behind a small API module (`src/api/…`), not inside random components.
- Accessible labels, keyboard focus, `prefers-reduced-motion`.

## Scaffolding the app

If `package.json` is missing, create a Vite React TypeScript app in this directory (not a nested extra folder). Add a `/api` proxy and a README only if asked.

Until the API exists, you may mock the contract from `Backend/animeLog/models.py` — same field names — then swap the mock for `fetch`.
