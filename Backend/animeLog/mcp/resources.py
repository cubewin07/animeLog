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


@sync_to_async
def get_taste_resource() -> str:
    """Return JSON string of the user's taste profile and analytical breakdown."""
    from .tools import get_taste_and_lessons_synthesis
    # get_taste_and_lessons_synthesis is wrapped in sync_to_async; call underlying or async
    from django.db.models import Avg, Count, F
    from animeLog.models import Genre, Studio

    top_genres = list(
        Genre.objects.annotate(
            anime_count=Count("anime_series", distinct=True),
            book_count=Count("books", distinct=True),
        )
        .annotate(total_usage=F("anime_count") + F("book_count"))
        .order_by("-total_usage")[:8]
        .values("name", "anime_count", "book_count")
    )
    top_studios = list(
        Studio.objects.annotate(
            season_count=Count("anime_seasons", distinct=True),
            movie_count=Count("anime_movies", distinct=True),
        )
        .annotate(total_usage=F("season_count") + F("movie_count"))
        .order_by("-total_usage")[:6]
        .values("name", "season_count", "movie_count")
    )
    avg_season_rating = AnimeSeason.objects.filter(rating__isnull=False).aggregate(Avg("rating"))["rating__avg"]
    avg_book_rating = Book.objects.filter(rating__isnull=False).aggregate(Avg("rating"))["rating__avg"]

    data = {
        "top_genres": top_genres,
        "top_studios": top_studios,
        "average_season_rating": round(avg_season_rating, 2) if avg_season_rating else None,
        "average_book_rating": round(avg_book_rating, 2) if avg_book_rating else None,
        "total_titles": AnimeSeries.objects.count() + Book.objects.count(),
        "total_rewatches": Rewatch.objects.count(),
        "total_characters": FavoriteCharacter.objects.count(),
    }
    return json.dumps(data, indent=2)


@sync_to_async
def get_markdown_resource() -> str:
    """Return full Obsidian-ready Markdown journal export."""
    from .tools import export_journal_markdown
    from datetime import date
    series_qs = AnimeSeries.objects.prefetch_related(
        "genres", "seasons__studios", "seasons__episode_notes", "movies__studios", "favorite_characters", "rewatches"
    ).all().order_by("-created_at")
    books_qs = Book.objects.prefetch_related("genres").all().order_by("-created_at")

    lines = [
        "---",
        "title: AnimeLog Personal Journal",
        f"exported_at: {date.today().isoformat()}",
        "---",
        "",
        "# AnimeLog Personal Journal",
        "",
        "## Anime Franchises",
    ]
    for s in series_qs:
        lines.append(f"\n### {s.title}")
        for sea in s.seasons.all():
            score = f" · {sea.rating}/10" if sea.rating else ""
            lines.append(f"- **Season {sea.season_number}:** {sea.title} ({sea.status}{score})")
            if sea.notes:
                lines.append(f"  > {sea.notes}")
    lines.append("\n## Books")
    for b in books_qs:
        score = f" · {b.rating}/10" if b.rating else ""
        lines.append(f"- **{b.title}** by {b.author or 'Unknown'} ({b.status}{score})")
        if b.notes:
            lines.append(f"  > {b.notes}")

    return "\n".join(lines)
