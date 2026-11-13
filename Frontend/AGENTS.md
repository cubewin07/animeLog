# Frontend

SPA for the personal anime/book journal. Built with React 19, TypeScript, Vite, React Router, and the Keyframe CSS design system (`--kf-*` tokens). Proxies to the Django REST API at `/api/`.

## Intended stack (locked)

Vite + React + TypeScript. Talks to the Django API at `/api/`.

Not Next.js, not Vue, not Django templates. Skip Next.js/RSC rules in `vercel-react-best-practices`; keep client, re-render, and bundle rules that apply to a Vite SPA.

## Commands (after scaffold)

Run from `Frontend/`.

| Command | What |
|---------|------|
| `npm install` | Install deps |
| `npm run dev` | Vite dev server (proxy `/api` to Django `:8000`) |
| `npm run typecheck` | TypeScript strict typecheck (`tsc --noEmit`) |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npm test` | Vitest unit tests |

Proxy `/api` in `vite.config.ts` to `http://127.0.0.1:8000` so the browser stays same-origin during dev.

## Product

The UI is a **journal**, not MyAnimeList.

- A title row without `notes` / `why` is incomplete. Make writing the lesson easy, not buried behind a tiny icon.
- Core destinations: **Home** (`/`), **Library** (`/anime`, `/books`, `/characters`), **+** (`AddTitleModal` & `Composer`), **Journal** (`/journal`), and **Me** (`/me`, `/me/recap/:year`), plus **Settings** (`/settings`, `/settings/find-art`).
- Use plain fan vocabulary everywhere (`Home`, `Note`, `Series`, `Season`, `Movie`, `Characters`, `Rewatch`, `Episode`).
- Status values must match `AnimeStatus` / `BookStatus` in `Backend/animeLog/models.py`.
- Rating is 1–10 or empty. Progress is episode/page count vs optional total.

## Visual direction

See [design.md](./design.md) for the **Keyframe** design system: ink-blue night studio (`#0D1017`), per-title color accents extracted from covers (`--title-accent`), key-frame paper (`#F4F6F1`) reserved exclusively for reading/writing notes, and reward gold (`#FFC857`) reserved for XP, achievements, and 9–10 ratings. Use CSS transitions/tokens (`--kf-*`) — do not re-introduce GSAP.

After building a screen, check desktop (`1440×900`) and mobile (`390×844`) viewports, keyboard focus (`Tab`/`Escape`/`⌘K`), accessible labels, and `prefers-reduced-motion`.

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
