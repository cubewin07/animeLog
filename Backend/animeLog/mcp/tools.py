"""
MCP Tools for AnimeLog.

Enables an AI agent to search, log, update, and manage:
- Anime Series, Seasons, Movies
- Episode Notes and reflections
- Books and reading progress
- Rewatch passes
- Favorite Characters with life lessons/reasons
"""

from datetime import date
from typing import Any
from asgiref.sync import sync_to_async
from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.db.models import Q

from animeLog.models import (
    AnimeMovie,
    AnimeSeason,
    AnimeSeries,
    AnimeStatus,
    Book,
    BookStatus,
    EpisodeNote,
    FavoriteCharacter,
    Genre,
    Rewatch,
    Studio,
)


def _get_or_create_genres(genre_names: list[str] | None) -> list[Genre]:
    if not genre_names:
        return []
    genres = []
    for name in genre_names:
        clean_name = str(name).strip()
        if clean_name:
            genre, _ = Genre.objects.get_or_create(name=clean_name)
            genres.append(genre)
    return genres


def _get_or_create_studios(studio_names: list[str] | None) -> list[Studio]:
    if not studio_names:
        return []
    studios = []
    for name in studio_names:
        clean_name = str(name).strip()
        if clean_name:
            studio, _ = Studio.objects.get_or_create(name=clean_name)
            studios.append(studio)
    return studios


# ---------------------------------------------------------------------------
# 1. Exploration & Search Tools
# ---------------------------------------------------------------------------

@sync_to_async
def search_journal(query: str = "", media_type: str = "all") -> list[dict[str, Any]]:
    """
    Search across all anime series, seasons, movies, books, episode notes, rewatches,
    and favorite characters by title, notes, character name, or author.

    Args:
        query: Keyword to search for in titles, notes, character names, why reasons, etc.
        media_type: One of 'all', 'anime', 'books', 'characters', 'rewatches'.
    """
    results: list[dict[str, Any]] = []
    q = query.strip()

    # Anime Series
    if media_type in ("all", "anime"):
        series_qs = AnimeSeries.objects.all()
        if q:
            series_qs = series_qs.filter(
                Q(title__icontains=q)
                | Q(japanese_title__icontains=q)
                | Q(romaji_title__icontains=q)
                | Q(seasons__notes__icontains=q)
                | Q(movies__notes__icontains=q)
            ).distinct()
        for s in series_qs[:20]:
            results.append({
                "type": "anime_series",
                "id": s.id,
                "title": s.title,
                "seasons_count": s.seasons.count(),
                "movies_count": s.movies.count(),
                "genres": [g.name for g in s.genres.all()],
            })

    # Books
    if media_type in ("all", "books"):
        book_qs = Book.objects.all()
        if q:
            book_qs = book_qs.filter(
                Q(title__icontains=q) | Q(author__icontains=q) | Q(notes__icontains=q)
            ).distinct()
        for b in book_qs[:20]:
            results.append({
                "type": "book",
                "id": b.id,
                "title": b.title,
                "author": b.author,
                "status": b.status,
                "progress": b.progress,
                "total_pages": b.total_pages,
                "rating": b.rating,
                "notes": b.notes,
            })

    # Favorite Characters
    if media_type in ("all", "characters"):
        char_qs = FavoriteCharacter.objects.select_related("series").all()
        if q:
            char_qs = char_qs.filter(Q(name__icontains=q) | Q(why__icontains=q)).distinct()
        for c in char_qs[:20]:
            results.append({
                "type": "favorite_character",
                "id": c.id,
                "name": c.name,
                "series_id": c.series_id,
                "series_title": c.series.title if c.series else "",
                "why": c.why,
            })

    # Rewatches
    if media_type in ("all", "rewatches"):
        rewatch_qs = Rewatch.objects.all()
        if q:
            rewatch_qs = rewatch_qs.filter(Q(notes__icontains=q) | Q(episode_title__icontains=q)).distinct()
        for r in rewatch_qs[:20]:
            results.append({
                "type": "rewatch",
                "id": r.id,
                "release_title": r.release_title,
                "series_title": r.series_title,
                "target_type": r.target_type,
                "rating": r.rating,
                "notes": r.notes,
            })

    return results


@sync_to_async
def get_journal_overview() -> dict[str, Any]:
    """
    Get high-level summary statistics and currently active anime and books.
    """
    active_anime_seasons = AnimeSeason.objects.filter(status=AnimeStatus.WATCHING).select_related("series")
    active_anime_movies = AnimeMovie.objects.filter(status=AnimeStatus.WATCHING).select_related("series")
    active_books = Book.objects.filter(status=BookStatus.READING)

    completed_seasons = AnimeSeason.objects.filter(status=AnimeStatus.COMPLETED).count()
    completed_movies = AnimeMovie.objects.filter(status=AnimeStatus.COMPLETED).count()
    completed_books = Book.objects.filter(status=BookStatus.COMPLETED).count()

    lessons_count = (
        AnimeSeason.objects.exclude(notes__isnull=True).exclude(notes="").count()
        + AnimeMovie.objects.exclude(notes__isnull=True).exclude(notes="").count()
        + Book.objects.exclude(notes__isnull=True).exclude(notes="").count()
        + Rewatch.objects.exclude(notes__isnull=True).exclude(notes="").count()
        + EpisodeNote.objects.exclude(note="").count()
    )

    return {
        "stats": {
            "active_watching_count": active_anime_seasons.count() + active_anime_movies.count(),
            "active_reading_count": active_books.count(),
            "total_completed": completed_seasons + completed_movies + completed_books,
            "total_lessons_count": lessons_count,
            "rewatches_count": Rewatch.objects.count(),
            "favorite_characters_count": FavoriteCharacter.objects.count(),
        },
        "active_watching": [
            {
                "id": s.id,
                "type": "season",
                "series_title": s.series.title,
                "title": s.title,
                "progress": s.progress,
                "total_episodes": s.total_episodes,
                "rating": s.rating,
            }
            for s in active_anime_seasons[:10]
        ] + [
            {
                "id": m.id,
                "type": "movie",
                "series_title": m.series.title,
                "title": m.title,
                "progress_minutes": m.progress_minutes,
                "total_minutes": m.total_minutes,
                "rating": m.rating,
            }
            for m in active_anime_movies[:10]
        ],
        "active_reading": [
            {
                "id": b.id,
                "title": b.title,
                "author": b.author,
                "progress": b.progress,
                "total_pages": b.total_pages,
                "rating": b.rating,
            }
            for b in active_books[:10]
        ],
    }


@sync_to_async
def get_series_detail(series_id: int) -> dict[str, Any]:
    """
    Get full detailed hierarchy of an anime series by ID, including its seasons,
    movies, episode notes, rewatches, and favorite characters.
    """
    try:
        series = AnimeSeries.objects.prefetch_related(
            "genres",
            "seasons__studios",
            "seasons__episode_notes",
            "movies__studios",
            "favorite_characters",
        ).get(pk=series_id)
    except AnimeSeries.DoesNotExist:
        return {"error": f"Anime series with ID {series_id} not found."}

    seasons_data = []
    for s in series.seasons.all():
        seasons_data.append({
            "id": s.id,
            "title": s.title,
            "season_number": s.season_number,
            "status": s.status,
            "progress": s.progress,
            "total_episodes": s.total_episodes,
            "rating": s.rating,
            "notes": s.notes,
            "studios": [st.name for st in s.studios.all()],
            "episode_notes": [
                {
                    "id": en.id,
                    "episode_number": en.episode_number,
                    "episode_title": en.episode_title,
                    "note": en.note,
                    "rating": en.rating,
                }
                for en in s.episode_notes.all()
            ],
        })

    movies_data = [
        {
            "id": m.id,
            "title": m.title,
            "status": m.status,
            "progress_minutes": m.progress_minutes,
            "total_minutes": m.total_minutes,
            "rating": m.rating,
            "notes": m.notes,
            "studios": [st.name for st in m.studios.all()],
        }
        for m in series.movies.all()
    ]

    characters_data = [
        {"id": c.id, "name": c.name, "why": c.why}
        for c in series.favorite_characters.all()
    ]

    return {
        "id": series.id,
        "title": series.title,
        "japanese_title": series.japanese_title,
        "romaji_title": series.romaji_title,
        "genres": [g.name for g in series.genres.all()],
        "seasons": seasons_data,
        "movies": movies_data,
        "favorite_characters": characters_data,
    }


@sync_to_async
def get_book_detail(book_id: int) -> dict[str, Any]:
    """
    Get full detail of a book entry by ID.
    """
    try:
        book = Book.objects.prefetch_related("genres").get(pk=book_id)
    except Book.DoesNotExist:
        return {"error": f"Book with ID {book_id} not found."}

    return {
        "id": book.id,
        "title": book.title,
        "author": book.author,
        "status": book.status,
        "rating": book.rating,
        "progress": book.progress,
        "total_pages": book.total_pages,
        "start_date": str(book.start_date) if book.start_date else None,
        "finish_date": str(book.finish_date) if book.finish_date else None,
        "notes": book.notes,
        "genres": [g.name for g in book.genres.all()],
    }


@sync_to_async
def list_genres_and_studios() -> dict[str, Any]:
    """
    List all registered genres and anime production studios to help choose standard names.
    """
    return {
        "genres": list(Genre.objects.values_list("name", flat=True)),
        "studios": list(Studio.objects.values_list("name", flat=True)),
    }


# ---------------------------------------------------------------------------
# 2. Anime & Franchise Creation Tools
# ---------------------------------------------------------------------------

@sync_to_async
def log_anime_series(
    title: str,
    japanese_title: str | None = None,
    romaji_title: str | None = None,
    genres: list[str] | None = None,
    initial_season_title: str = "Season 1",
    initial_season_episodes: int | None = None,
    initial_season_status: str = "PLAN_TO_WATCH",
    initial_season_rating: int | None = None,
    initial_season_notes: str | None = None,
    studios: list[str] | None = None,
) -> dict[str, Any]:
    """
    Create a new Anime Series franchise and automatically create its initial Season 1.

    Args:
        title: Title of the anime series (e.g. 'Frieren: Beyond Journey's End')
        japanese_title: Japanese native title (optional)
        romaji_title: Romaji title (optional)
        genres: List of genre names (e.g. ['Fantasy', 'Adventure', 'Drama'])
        initial_season_title: Title for Season 1 (default: 'Season 1')
        initial_season_episodes: Total episode count if known (e.g. 28)
        initial_season_status: Status ('WATCHING', 'COMPLETED', 'ON_HOLD', 'DROPPED', 'PLAN_TO_WATCH')
        initial_season_rating: Rating 1-10 (optional)
        initial_season_notes: Personal lesson/reflection/memory note (optional)
        studios: List of studio names (e.g. ['Madhouse'])
    """
    status_val = initial_season_status.upper().strip()
    if status_val not in AnimeStatus.values:
        status_val = AnimeStatus.PLAN_TO_WATCH

    with transaction.atomic():
        series = AnimeSeries.objects.create(
            title=title.strip(),
            japanese_title=japanese_title.strip() if japanese_title else None,
            romaji_title=romaji_title.strip() if romaji_title else None,
        )
        if genres:
            genre_objs = _get_or_create_genres(genres)
            series.genres.set(genre_objs)

        season = AnimeSeason.objects.create(
            series=series,
            title=initial_season_title.strip() or "Season 1",
            season_number=1,
            status=status_val,
            total_episodes=initial_season_episodes,
            progress=initial_season_episodes if status_val == AnimeStatus.COMPLETED and initial_season_episodes else 0,
            rating=initial_season_rating,
            notes=initial_season_notes.strip() if initial_season_notes else None,
            finish_date=date.today() if status_val == AnimeStatus.COMPLETED else None,
        )
        if studios:
            studio_objs = _get_or_create_studios(studios)
            season.studios.set(studio_objs)

    return {
        "success": True,
        "message": f"Successfully created anime series '{series.title}' with {season.title}.",
        "series_id": series.id,
        "season_id": season.id,
        "status": season.status,
    }


@sync_to_async
def add_anime_season(
    series_id: int,
    title: str,
    season_number: int,
    status: str = "PLAN_TO_WATCH",
    total_episodes: int | None = None,
    progress: int = 0,
    rating: int | None = None,
    notes: str | None = None,
    studios: list[str] | None = None,
) -> dict[str, Any]:
    """
    Add a new season (e.g. Season 2, Season 3) to an existing anime series.

    Args:
        series_id: ID of the parent AnimeSeries
        title: Season title (e.g. 'Season 2' or 'Entertainment District Arc')
        season_number: Numeric season number (must be >= 1 and unique within the series)
        status: Status ('WATCHING', 'COMPLETED', 'ON_HOLD', 'DROPPED', 'PLAN_TO_WATCH')
        total_episodes: Total episode count
        progress: Current episode progress
        rating: Rating 1-10
        notes: Personal reflection or lessons
        studios: Studio names producing this season
    """
    try:
        series = AnimeSeries.objects.get(pk=series_id)
    except AnimeSeries.DoesNotExist:
        return {"success": False, "error": f"Anime series with ID {series_id} does not exist."}

    status_val = status.upper().strip()
    if status_val not in AnimeStatus.values:
        status_val = AnimeStatus.PLAN_TO_WATCH

    with transaction.atomic():
        season = AnimeSeason.objects.create(
            series=series,
            title=title.strip(),
            season_number=season_number,
            status=status_val,
            total_episodes=total_episodes,
            progress=progress,
            rating=rating,
            notes=notes.strip() if notes else None,
            finish_date=date.today() if status_val == AnimeStatus.COMPLETED else None,
        )
        if studios:
            studio_objs = _get_or_create_studios(studios)
            season.studios.set(studio_objs)

    return {
        "success": True,
        "message": f"Added season '{season.title}' (Season {season.season_number}) to series '{series.title}'.",
        "season_id": season.id,
        "series_id": series.id,
    }


@sync_to_async
def add_anime_movie(
    series_id: int,
    title: str,
    status: str = "PLAN_TO_WATCH",
    total_minutes: int | None = None,
    progress_minutes: int = 0,
    rating: int | None = None,
    notes: str | None = None,
    studios: list[str] | None = None,
) -> dict[str, Any]:
    """
    Add an anime movie release to an existing anime series.

    Args:
        series_id: ID of the parent AnimeSeries
        title: Movie title (e.g. 'Mugen Train')
        status: Status ('WATCHING', 'COMPLETED', 'ON_HOLD', 'DROPPED', 'PLAN_TO_WATCH')
        total_minutes: Movie runtime in minutes (e.g. 117)
        progress_minutes: Progress in minutes watched
        rating: Rating 1-10
        notes: Personal reflection or lessons
        studios: Production studios
    """
    try:
        series = AnimeSeries.objects.get(pk=series_id)
    except AnimeSeries.DoesNotExist:
        return {"success": False, "error": f"Anime series with ID {series_id} does not exist."}

    status_val = status.upper().strip()
    if status_val not in AnimeStatus.values:
        status_val = AnimeStatus.PLAN_TO_WATCH

    with transaction.atomic():
        movie = AnimeMovie.objects.create(
            series=series,
            title=title.strip(),
            status=status_val,
            total_minutes=total_minutes,
            progress_minutes=progress_minutes,
            rating=rating,
            notes=notes.strip() if notes else None,
            finish_date=date.today() if status_val == AnimeStatus.COMPLETED else None,
        )
        if studios:
            studio_objs = _get_or_create_studios(studios)
            movie.studios.set(studio_objs)

    return {
        "success": True,
        "message": f"Added movie '{movie.title}' to series '{series.title}'.",
        "movie_id": movie.id,
        "series_id": series.id,
    }


# ---------------------------------------------------------------------------
# 3. Progress, Updates & Episode Reflections
# ---------------------------------------------------------------------------

@sync_to_async
def update_anime_progress(
    target_type: str,
    target_id: int,
    progress: int,
    status: str | None = None,
    rating: int | None = None,
    notes: str | None = None,
) -> dict[str, Any]:
    """
    Update watch progress (episodes or minutes), rating, and notes on an anime season or movie.
    Automatically handles status transitions (e.g. PLAN_TO_WATCH -> WATCHING, or WATCHING -> COMPLETED).

    Args:
        target_type: 'season' or 'movie'
        target_id: ID of the season or movie
        progress: New progress count (episodes for season, minutes for movie)
        status: Optional explicit status override ('WATCHING', 'COMPLETED', 'ON_HOLD', 'DROPPED', 'PLAN_TO_WATCH')
        rating: Optional rating 1-10
        notes: Optional lesson / reflection notes update
    """
    norm_type = target_type.lower().strip()
    if norm_type == "season":
        try:
            item = AnimeSeason.objects.get(pk=target_id)
        except AnimeSeason.DoesNotExist:
            return {"success": False, "error": f"Season with ID {target_id} not found."}

        item.progress = progress
        if status:
            s_val = status.upper().strip()
            if s_val in AnimeStatus.values:
                item.status = s_val
        else:
            if item.status == AnimeStatus.PLAN_TO_WATCH and progress > 0:
                item.status = AnimeStatus.WATCHING
            if item.total_episodes and progress >= item.total_episodes and item.status == AnimeStatus.WATCHING:
                item.status = AnimeStatus.COMPLETED
                if not item.finish_date:
                    item.finish_date = date.today()

        if rating is not None:
            item.rating = rating
        if notes is not None:
            item.notes = notes.strip()
        item.save()

        return {
            "success": True,
            "message": f"Updated season '{item.title}' progress to {item.progress}/{item.total_episodes or '?'}.",
            "status": item.status,
            "progress": item.progress,
            "rating": item.rating,
        }

    elif norm_type == "movie":
        try:
            movie = AnimeMovie.objects.get(pk=target_id)
        except AnimeMovie.DoesNotExist:
            return {"success": False, "error": f"Movie with ID {target_id} not found."}

        movie.progress_minutes = progress
        if status:
            s_val = status.upper().strip()
            if s_val in AnimeStatus.values:
                movie.status = s_val
        else:
            if movie.status == AnimeStatus.PLAN_TO_WATCH and progress > 0:
                movie.status = AnimeStatus.WATCHING
            if movie.total_minutes and progress >= movie.total_minutes and movie.status == AnimeStatus.WATCHING:
                movie.status = AnimeStatus.COMPLETED
                if not movie.finish_date:
                    movie.finish_date = date.today()

        if rating is not None:
            movie.rating = rating
        if notes is not None:
            movie.notes = notes.strip()
        movie.save()

        return {
            "success": True,
            "message": f"Updated movie '{movie.title}' progress to {movie.progress_minutes}/{movie.total_minutes or '?'} mins.",
            "status": movie.status,
            "progress_minutes": movie.progress_minutes,
            "rating": movie.rating,
        }
    else:
        return {"success": False, "error": f"Invalid target_type '{target_type}'. Must be 'season' or 'movie'."}


@sync_to_async
def add_episode_note(
    season_id: int,
    episode_number: int,
    note: str,
    episode_title: str | None = None,
    rating: int | None = None,
) -> dict[str, Any]:
    """
    Log an episode-specific memory, thought, or reflection.

    Args:
        season_id: ID of the AnimeSeason
        episode_number: Episode number (e.g. 10)
        note: The lesson, memory, or reflection for this specific episode
        episode_title: Optional episode title
        rating: Optional episode rating (1-10)
    """
    try:
        season = AnimeSeason.objects.get(pk=season_id)
    except AnimeSeason.DoesNotExist:
        return {"success": False, "error": f"Season with ID {season_id} not found."}

    ep_note, created = EpisodeNote.objects.update_or_create(
        season=season,
        episode_number=episode_number,
        defaults={
            "note": note.strip(),
            "episode_title": episode_title.strip() if episode_title else None,
            "rating": rating,
        },
    )

    action = "Created" if created else "Updated"
    return {
        "success": True,
        "message": f"{action} episode note for {season.title} Episode {episode_number}.",
        "episode_note_id": ep_note.id,
    }


# ---------------------------------------------------------------------------
# 4. Rewatches & Favorite Characters
# ---------------------------------------------------------------------------

@sync_to_async
def log_rewatch(
    target_type: str,
    target_id: int,
    rating: int | None = None,
    notes: str | None = None,
    episode_number: int | None = None,
    episode_title: str | None = None,
    start_date: str | None = None,
    finish_date: str | None = None,
) -> dict[str, Any]:
    """
    Log a rewatch pass for a series, season, movie, or specific episode.
    Rewatches capture how life lessons deepen over time.

    Args:
        target_type: 'series', 'season', 'movie', or 'episode'
        target_id: ID of the series, season, or movie (for 'episode', target_id is the season ID)
        rating: Optional rewatch rating (1-10)
        notes: Lessons or new thoughts discovered upon rewatching
        episode_number: Optional episode number if rewatching a single episode
        episode_title: Optional episode title
        start_date: 'YYYY-MM-DD' (defaults to today if finish_date is set or not provided)
        finish_date: 'YYYY-MM-DD'
    """
    norm_type = target_type.lower().strip()
    target_map = {
        "series": AnimeSeries,
        "season": AnimeSeason,
        "movie": AnimeMovie,
        "episode": AnimeSeason,
    }
    if norm_type not in target_map:
        return {"success": False, "error": f"Invalid target_type '{target_type}'. Must be series, season, movie, or episode."}

    model_cls = target_map[norm_type]
    try:
        target_obj = model_cls.objects.get(pk=target_id)
    except model_cls.DoesNotExist:
        return {"success": False, "error": f"{model_cls._meta.verbose_name} with ID {target_id} does not exist."}

    content_type = ContentType.objects.get_for_model(model_cls)

    rewatch = Rewatch.objects.create(
        content_type=content_type,
        object_id=target_id,
        episode_number=episode_number if norm_type == "episode" else None,
        episode_title=episode_title.strip() if episode_title else None,
        rating=rating,
        notes=notes.strip() if notes else None,
        start_date=start_date or (date.today() if not finish_date else None),
        finish_date=finish_date,
    )

    return {
        "success": True,
        "message": f"Logged rewatch pass for '{rewatch.release_title}'.",
        "rewatch_id": rewatch.id,
    }


@sync_to_async
def add_favorite_character(series_id: int, name: str, why: str) -> dict[str, Any]:
    """
    Add a memorable favorite character and the core reason / lesson why they inspired you.

    Args:
        series_id: ID of the AnimeSeries this character belongs to
        name: Name of the character (e.g. 'Himmel the Hero')
        why: The reason / lesson why this character is memorable to you
    """
    try:
        series = AnimeSeries.objects.get(pk=series_id)
    except AnimeSeries.DoesNotExist:
        return {"success": False, "error": f"Series with ID {series_id} not found."}

    char = FavoriteCharacter.objects.create(
        series=series,
        name=name.strip(),
        why=why.strip() if why else None,
    )

    return {
        "success": True,
        "message": f"Added favorite character '{char.name}' for series '{series.title}'.",
        "character_id": char.id,
    }


# ---------------------------------------------------------------------------
# 5. Book Journaling Tools
# ---------------------------------------------------------------------------

@sync_to_async
def log_book(
    title: str,
    author: str | None = None,
    status: str = "PLAN_TO_READ",
    total_pages: int | None = None,
    progress: int = 0,
    rating: int | None = None,
    notes: str | None = None,
    genres: list[str] | None = None,
) -> dict[str, Any]:
    """
    Log a new book in your reading journal.

    Args:
        title: Title of the book
        author: Author of the book
        status: Status ('READING', 'COMPLETED', 'ON_HOLD', 'DROPPED', 'PLAN_TO_READ')
        total_pages: Total page count
        progress: Current page progress
        rating: Rating 1-10
        notes: Personal reflections, quotes, or key takeaways
        genres: Genre tags
    """
    status_val = status.upper().strip()
    if status_val not in BookStatus.values:
        status_val = BookStatus.PLAN_TO_READ

    with transaction.atomic():
        book = Book.objects.create(
            title=title.strip(),
            author=author.strip() if author else None,
            status=status_val,
            total_pages=total_pages,
            progress=progress,
            rating=rating,
            notes=notes.strip() if notes else None,
            finish_date=date.today() if status_val == BookStatus.COMPLETED else None,
        )
        if genres:
            genre_objs = _get_or_create_genres(genres)
            book.genres.set(genre_objs)

    return {
        "success": True,
        "message": f"Logged book '{book.title}' by {book.author or 'Unknown'}.",
        "book_id": book.id,
        "status": book.status,
    }


@sync_to_async
def update_book_progress(
    book_id: int,
    progress: int,
    status: str | None = None,
    rating: int | None = None,
    notes: str | None = None,
) -> dict[str, Any]:
    """
    Update reading progress, status, rating, or lesson notes on a book.

    Args:
        book_id: ID of the Book
        progress: Current page / chapter progress
        status: Optional explicit status ('READING', 'COMPLETED', 'ON_HOLD', 'DROPPED', 'PLAN_TO_READ')
        rating: Optional rating 1-10
        notes: Optional reflection / notes update
    """
    try:
        book = Book.objects.get(pk=book_id)
    except Book.DoesNotExist:
        return {"success": False, "error": f"Book with ID {book_id} not found."}

    book.progress = progress
    if status:
        s_val = status.upper().strip()
        if s_val in BookStatus.values:
            book.status = s_val
    else:
        if book.status == BookStatus.PLAN_TO_READ and progress > 0:
            book.status = BookStatus.READING
        if book.total_pages and progress >= book.total_pages and book.status == BookStatus.READING:
            book.status = BookStatus.COMPLETED
            if not book.finish_date:
                book.finish_date = date.today()

    if rating is not None:
        book.rating = rating
    if notes is not None:
        book.notes = notes.strip()
    book.save()

    return {
        "success": True,
        "message": f"Updated book '{book.title}' progress to {book.progress}/{book.total_pages or '?'}.",
        "status": book.status,
        "progress": book.progress,
        "rating": book.rating,
    }
