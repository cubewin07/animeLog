# AnimeLog 📖✨

> A personal anime and book journal designed to preserve **memories, reflections, and lessons learned** — not just catalog metadata.

[![Django](https://img.shields.io/badge/Django-6.1-092E20?logo=django&logoColor=white)](https://www.djangoproject.com/)
[![DRF](https://img.shields.io/badge/Django_REST_Framework-3.18-red?logo=django)](https://www.django-rest-framework.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media_Storage-3448C5?logo=cloudinary&logoColor=white)](https://cloudinary.com/)

---

## 🌟 Philosophy & Overview

Most trackers treat media as a checkbox or status counter. **AnimeLog** is crafted with a different purpose: **every title, rewatch, and character is a vessel for personal insights and life lessons**.

Catalog fields (status, progress, ratings, release dates) exist to give each memory a structured home. Whether recording thoughts on a specific season, taking notes on a single pivotal episode, logging a deeper second viewing, or reflecting on why a fictional character left a mark, AnimeLog makes reflection the central experience.

---

## ✨ Key Features

### 📺 1. Multi-Tier Anime Architecture (Series → Seasons & Movies)
- **Hierarchical Structure**: Group multiple seasons and movies under unified Anime Series (e.g. *Frieren: Beyond Journey's End*, *Steins;Gate*, *Monogatari Series*).
- **Per-Season & Per-Movie Tracking**: Track status (`WATCHING`, `COMPLETED`, `ON_HOLD`, `DROPPED`, `PLAN_TO_WATCH`), progress (episodes/minutes), ratings (1–10 scale), dates, studios, and extensive reflections.
- **Episode-by-Episode Notes**: Take granular, timestamped notes and episode-specific ratings within any season.

### 🔁 2. First-Class Rewatch Timeline
- Rewatching media often uncovers nuances missed the first time. AnimeLog treats rewatches as first-class citizens, tracking repeat passes per season or movie along with evolving takeaways and updated scores.

### 📚 3. Book Journaling
- Track reading journeys (status, page/chapter progress, total pages, author, genres, rating 1–10) alongside dedicated reflections on literature.

### 🎭 4. Favorite Characters & Takeaways
- Log memorable characters and articulate *why* they resonated, linking them to their respective series and visual media galleries.

### 🖼️ 5. Media Library & Cloudinary Integration
- Built-in folder hierarchy and image manager (`Folder` & `Image` models).
- Direct integration with Cloudinary cloud storage for covers and gallery artwork.
- Media picker modal embedded across all entry creation and editing forms.

### 📊 6. Interactive Dashboard & Analytics
- Live journal statistics (total series, seasons, movies, books, episodes logged, completion rates, average ratings, top genres).
- Dual presentation: Interactive Card Grid with detailed accordions and sortable / filterable Table View.
- Fluid micro-interactions powered by GSAP animations.

---

## 🏗️ Architecture & Tech Stack

```
anime_log/
├── Backend/                 # Django 6.1 + Django REST Framework backend
│   ├── animeLog/            # Core app (models, serializers, views, admin, signals)
│   │   ├── management/      # Custom commands (e.g., `seed_journal`)
│   │   ├── migrations/      # Database migrations
│   │   ├── models.py        # Domain schema & constraint validations
│   │   ├── serializers.py   # DRF ModelSerializers with nested representations
│   │   ├── signals.py       # File cleanup and lifecycle signals
│   │   ├── views.py         # DRF ViewSets & custom StatsView
│   │   └── tests.py         # Full automated test suite (APITestCase & Model tests)
│   ├── config/              # Project settings, URL routing, CORS & Cloudinary setup
│   ├── requirement.txt      # Python dependencies
│   └── manage.py            # Django CLI entrypoint
├── Frontend/                # Vite + React 19 + TypeScript Single Page Application
│   ├── src/
│   │   ├── api/             # API client, DRF integration & offline fallback
│   │   ├── components/      # Reusable UI components (AnimeCard, EntryModal, Modals, etc.)
│   │   ├── views/           # Core views (Dashboard, Anime, Books, Characters, Media, Rewatches)
│   │   ├── types/           # TypeScript interfaces matching backend models
│   │   ├── utils/           # GSAP animation helpers & utility functions
│   │   └── index.css        # Vanilla CSS design system & custom properties
│   ├── package.json
│   └── vite.config.ts       # Vite configuration with `/api` proxy
└── docs/                    # Architecture plans and technical documentation
```

### Stack Summary

| Layer | Technologies |
|---|---|
| **Backend** | Python 3.14, Django 6.1, Django REST Framework, SQLite, `django-cors-headers`, `django-environ` |
| **Media Storage** | Cloudinary, `django-cloudinary-storage`, Pillow |
| **Frontend** | React 19, TypeScript, Vite 8, Lucide React, GSAP 3 |
| **Styling** | Vanilla CSS (Dark mode design system, Glassmorphism, Responsive layout) |

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.14+**
- **Node.js 18+** & **npm**
- (Optional) **Cloudinary Account** for cloud image uploads (local storage / placeholder fallbacks supported)

---

### Backend Setup

1. **Navigate to the Backend directory and activate a virtual environment**:
   ```bash
   cd Backend
   python3 -m venv .venv
   source .venv/bin/activate   # On Windows: .venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirement.txt
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in `Backend/`:
   ```env
   SECRET_KEY=django-insecure-local-dev-key-change-in-production
   DEBUG=True
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

4. **Apply database migrations**:
   ```bash
   python manage.py migrate
   ```

5. **(Optional) Seed sample journal data**:
   Populate genres, studios, series (*Frieren*, *Steins;Gate*, *Vinland Saga*), seasons, movies, episode notes, books, rewatches, and characters:
   ```bash
   python manage.py seed_journal
   ```

6. **Create a superuser (for Django Admin)**:
   ```bash
   python manage.py createsuperuser
   ```

7. **Start the Django development server**:
   ```bash
   python manage.py runserver
   ```
   - Backend API: `http://127.0.0.1:8000/api/`
   - Django Admin: `http://127.0.0.1:8000/admin/`

---

### Frontend Setup

1. **Navigate to the Frontend directory**:
   ```bash
   cd ../Frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the Vite development server**:
   ```bash
   npm run dev
   ```
   - Access the application at `http://localhost:5173` (requests to `/api` are automatically proxied to Django on port `8000`).

---

## 📡 REST API Reference

All endpoints return and consume DRF standard JSON objects:

| Endpoint | Method(s) | Description |
|---|---|---|
| `/api/series/` | `GET`, `POST`, `PUT`, `PATCH`, `DELETE` | List & manage Anime Series (with nested seasons & movies) |
| `/api/seasons/` | `GET`, `POST`, `PUT`, `PATCH`, `DELETE` | Manage Anime Seasons (ratings, progress, notes, studios) |
| `/api/movies/` | `GET`, `POST`, `PUT`, `PATCH`, `DELETE` | Manage Anime Movies (minutes, ratings, notes, studios) |
| `/api/episode-notes/` | `GET`, `POST`, `PUT`, `PATCH`, `DELETE` | Granular episode notes and episode ratings |
| `/api/books/` | `GET`, `POST`, `PUT`, `PATCH`, `DELETE` | Book journal entries, reading progress, and takeaways |
| `/api/characters/` | `GET`, `POST`, `PUT`, `PATCH`, `DELETE` | Favorite characters and lessons learned |
| `/api/rewatches/` | `GET`, `POST`, `PUT`, `PATCH`, `DELETE` | Rewatch logs targeting a season or movie |
| `/api/genres/` | `GET`, `POST`, `DELETE` | Shared genres for anime and books |
| `/api/studios/` | `GET`, `POST`, `DELETE` | Production studios |
| `/api/folders/` | `GET`, `POST`, `PUT`, `PATCH`, `DELETE` | Nested folder hierarchy for media organization |
| `/api/images/` | `GET`, `POST`, `DELETE` | Image uploads, metadata, and folder assignments |
| `/api/stats/` | `GET` | Aggregated journal stats & overview analytics |

---

## 🧪 Testing & Validation

### Backend Tests
The backend includes test coverage for model constraints, database integrity checks, nested serializers, and API endpoints:

```bash
cd Backend
source .venv/bin/activate
python manage.py test animeLog
```

### Frontend Checks
```bash
cd Frontend
npm run lint
npm run build
```

---

## 📜 Domain & Design Guidelines

- **Memories First**: Always record the *lesson* or *reflection* alongside status and numbers.
- **Rating Consistency**: Normalized 1–10 scale across all media, seasons, movies, and episodes.
- **Progress Tracking**: Count-based (e.g. Episode 14 / 28 or Page 320 / 450), rather than percentage-based.
- **DRF Plain JSON**: Consistent JSON output from serializers without artificial wrapping envelopes.

---

## 📄 License

This project is open-source for personal use and learning.
