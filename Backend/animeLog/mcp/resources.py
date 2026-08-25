"""
MCP Resources for AnimeLog.
Provides read-only URI representations of journal state.
"""

import json
from asgiref.sync import sync_to_async
from animeLog.models import (
    AnimeMovie,
    AnimeSeason,
    AnimeSeries,
    AnimeStatus,
    Book,
    BookStatus,
    EpisodeNote,
    FavoriteCharacter,
    Rewatch,
)


@sync_to_async
def get_stats_resource() -> str:
    """Return JSON string of current journal statistics."""
    stats = {
        "active_watching_seasons": AnimeSeason.objects.filter(status=AnimeStatus.WATCHING).count(),
        "active_watching_movies": AnimeMovie.objects.filter(status=AnimeStatus.WATCHING).count(),
        "active_reading_books": Book.objects.filter(status=BookStatus.READING).count(),
        "completed_seasons": AnimeSeason.objects.filter(status=AnimeStatus.COMPLETED).count(),
        "completed_movies": AnimeMovie.objects.filter(status=AnimeStatus.COMPLETED).count(),
        "completed_books": Book.objects.filter(status=BookStatus.COMPLETED).count(),
        "total_series": AnimeSeries.objects.count(),
        "total_rewatches": Rewatch.objects.count(),
        "total_favorite_characters": FavoriteCharacter.objects.count(),
    }
    return json.dumps(stats, indent=2)


@sync_to_async
def get_active_resource() -> str:
    """Return JSON string of all currently watching anime and reading books."""
    active_seasons = [
        {
            "id": s.id,
            "series": s.series.title,
            "title": s.title,
            "progress": s.progress,
            "total_episodes": s.total_episodes,
        }
        for s in AnimeSeason.objects.filter(status=AnimeStatus.WATCHING).select_related("series")
    ]
    active_movies = [
        {
            "id": m.id,
            "series": m.series.title,
            "title": m.title,
            "progress_minutes": m.progress_minutes,
            "total_minutes": m.total_minutes,
        }
        for m in AnimeMovie.objects.filter(status=AnimeStatus.WATCHING).select_related("series")
    ]
    active_books = [
        {
            "id": b.id,
            "title": b.title,
            "author": b.author,
            "progress": b.progress,
            "total_pages": b.total_pages,
        }
        for b in Book.objects.filter(status=BookStatus.READING)
    ]
    return json.dumps({
        "watching_seasons": active_seasons,
        "watching_movies": active_movies,
        "reading_books": active_books,
    }, indent=2)


@sync_to_async
def get_lessons_resource() -> str:
    """Return JSON string of all lessons and reflections logged across anime and books."""
    seasons = [
        {"source": f"{s.series.title} - {s.title}", "rating": s.rating, "lesson": s.notes}
        for s in AnimeSeason.objects.exclude(notes__isnull=True).exclude(notes="").select_related("series")
    ]
    movies = [
        {"source": f"{m.series.title} - {m.title} (Movie)", "rating": m.rating, "lesson": m.notes}
        for m in AnimeMovie.objects.exclude(notes__isnull=True).exclude(notes="").select_related("series")
    ]
    books = [
        {"source": f"Book: {b.title}", "rating": b.rating, "lesson": b.notes}
        for b in Book.objects.exclude(notes__isnull=True).exclude(notes="")
    ]
    characters = [
        {"source": f"Character: {c.name} ({c.series.title})", "why_lesson": c.why}
        for c in FavoriteCharacter.objects.exclude(why__isnull=True).exclude(why="").select_related("series")
    ]
    rewatches = [
        {"source": f"Rewatch: {r.release_title}", "rating": r.rating, "lesson": r.notes}
        for r in Rewatch.objects.exclude(notes__isnull=True).exclude(notes="")
    ]
    return json.dumps({
        "anime_seasons": seasons,
        "anime_movies": movies,
        "books": books,
        "characters": characters,
        "rewatches": rewatches,
    }, indent=2)
