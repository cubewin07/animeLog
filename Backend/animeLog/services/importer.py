"""
Import service for AnimeLog personal journal.

Supports:
1. Direct MyAnimeList profile import via Jikan v4 user animelist API.
2. JSON backup restoration (series, books, rewatches, characters).
"""

import logging
import urllib.parse
from typing import Any, Optional
import requests
from django.db import transaction

from animeLog.models import (
    AnimeMovie,
    AnimeSeries,
    AnimeSeason,
    AnimeStatus,
    Book,
    BookStatus,
    FavoriteCharacter,
    Genre,
    Rewatch,
)
from .metadata_lookup import USER_AGENT, REQUEST_TIMEOUT, ExternalServiceError

logger = logging.getLogger(__name__)

STATUS_MAP = {
    "watching": AnimeStatus.WATCHING,
    "1": AnimeStatus.WATCHING,
    "completed": AnimeStatus.COMPLETED,
    "2": AnimeStatus.COMPLETED,
    "on_hold": AnimeStatus.ON_HOLD,
    "on-hold": AnimeStatus.ON_HOLD,
    "3": AnimeStatus.ON_HOLD,
    "dropped": AnimeStatus.DROPPED,
    "4": AnimeStatus.DROPPED,
    "plan_to_watch": AnimeStatus.PLAN_TO_WATCH,
    "plan to watch": AnimeStatus.PLAN_TO_WATCH,
    "6": AnimeStatus.PLAN_TO_WATCH,
}


def import_mal_username(username: str, limit: int = 50) -> dict[str, Any]:
    """
    Import public anime list for a MyAnimeList username via Jikan API.
    """
    clean_user = username.strip()
    if not clean_user:
        raise ValueError("Username cannot be empty.")

    url = f"https://api.jikan.moe/v4/users/{urllib.parse.quote(clean_user)}/animelist?limit={max(1, min(limit, 100))}"
    try:
        resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=REQUEST_TIMEOUT)
    except Exception as exc:
        raise ExternalServiceError(f"Could not connect to MyAnimeList/Jikan: {exc}")

    if resp.status_code == 404:
        raise ExternalServiceError(f"MyAnimeList user '{clean_user}' not found or profile is private.", 404)
    if resp.status_code == 429:
        raise ExternalServiceError("MyAnimeList rate limit reached. Please wait a moment and try again.", 429)
    if resp.status_code != 200:
        raise ExternalServiceError(f"MyAnimeList returned status {resp.status_code}.", 502)

    try:
        data = resp.json().get("data", [])
    except Exception as exc:
        raise ExternalServiceError(f"Invalid JSON received from MyAnimeList: {exc}", 502)

    imported_count = 0
    updated_count = 0

    with transaction.atomic():
        for item in data:
            entry = item.get("entry", {})
            title = entry.get("title")
            if not title:
                continue

            raw_status = str(item.get("status") or "watching").lower()
            anime_status = STATUS_MAP.get(raw_status, AnimeStatus.WATCHING)

            raw_score = item.get("score")
            score = int(raw_score) if raw_score and 1 <= int(raw_score) <= 10 else None

            progress = item.get("episodes_seen") or 0
            total_episodes = item.get("episodes_total") or None

            series, created = AnimeSeries.objects.get_or_create(
                title=title,
                defaults={
                    "japanese_title": entry.get("title_japanese"),
                },
            )
            if created:
                imported_count += 1
            else:
                updated_count += 1

            season, season_created = AnimeSeason.objects.get_or_create(
                series=series,
                season_number=1,
                defaults={
                    "title": "Season 1",
                    "status": anime_status,
                    "rating": score,
                    "progress": progress,
                    "total_episodes": total_episodes,
                },
            )
            if not season_created:
                season.status = anime_status
                if score is not None:
                    season.rating = score
                if progress:
                    season.progress = progress
                if total_episodes:
                    season.total_episodes = total_episodes
                season.save()

    return {
        "success": True,
        "username": clean_user,
        "total_processed": len(data),
        "imported_count": imported_count,
        "updated_count": updated_count,
    }


def _resolve_rewatch_target(item: dict[str, Any]) -> Any:
    """Resolve a rewatch JSON entry to its AnimeSeries, AnimeSeason, or AnimeMovie target."""
    target_type = str(item.get("target_type") or "").lower().strip()
    series_title = str(item.get("series_title") or "").strip()
    release_title = str(item.get("release_title") or "").strip()
    episode_number = item.get("episode_number")
    target_id = item.get("target_id")
    series_id = item.get("series_id") or item.get("series")
    season_id = item.get("season_id") or item.get("season")
    movie_id = item.get("movie_id") or item.get("movie")

    series_obj = None
    if series_title:
        series_obj = AnimeSeries.objects.filter(title__iexact=series_title).first()
    elif isinstance(series_id, int):
        series_obj = AnimeSeries.objects.filter(id=series_id).first()

    if target_type == "series":
        lookup_title = release_title or series_title
        if lookup_title:
            match = AnimeSeries.objects.filter(title__iexact=lookup_title).first()
            if match:
                return match
        if series_obj:
            return series_obj
        ref_id = target_id if isinstance(target_id, int) else series_id
        return AnimeSeries.objects.filter(id=ref_id).first() if isinstance(ref_id, int) else None

    if target_type in ("season", "episode"):
        season_title = (
            release_title.split(" — Ep ", 1)[0].strip()
            if (episode_number is not None or " — Ep " in release_title)
            else release_title
        )
        if series_obj and season_title:
            match = AnimeSeason.objects.filter(series=series_obj, title__iexact=season_title).first()
            if match:
                return match
        if series_obj:
            match = AnimeSeason.objects.filter(series=series_obj).order_by("season_number", "id").first()
            if match:
                return match
        if season_title:
            match = AnimeSeason.objects.filter(title__iexact=season_title).first()
            if match:
                return match
        ref_id = season_id if isinstance(season_id, int) else target_id
        return AnimeSeason.objects.filter(id=ref_id).first() if isinstance(ref_id, int) else None

    if target_type == "movie":
        if series_obj and release_title:
            match = AnimeMovie.objects.filter(series=series_obj, title__iexact=release_title).first()
            if match:
                return match
        if series_obj:
            match = AnimeMovie.objects.filter(series=series_obj).order_by("created_at", "id").first()
            if match:
                return match
        if release_title:
            match = AnimeMovie.objects.filter(title__iexact=release_title).first()
            if match:
                return match
        ref_id = movie_id if isinstance(movie_id, int) else target_id
        return AnimeMovie.objects.filter(id=ref_id).first() if isinstance(ref_id, int) else None

    # Untyped / legacy backups
    if series_obj and release_title:
        return (
            AnimeSeason.objects.filter(series=series_obj, title__iexact=release_title).first()
            or AnimeMovie.objects.filter(series=series_obj, title__iexact=release_title).first()
            or (series_obj if series_obj.title.lower() == release_title.lower() else None)
            or series_obj
        )
    if release_title:
        return (
            AnimeSeries.objects.filter(title__iexact=release_title).first()
            or AnimeSeason.objects.filter(title__iexact=release_title).first()
            or AnimeMovie.objects.filter(title__iexact=release_title).first()
        )
    return series_obj


def import_journal_json(data: dict[str, Any]) -> dict[str, Any]:
    """
    Restore journal entries from an AnimeLog JSON backup or external export.
    """
    series_list = data.get("series", [])
    books_list = data.get("books", [])
    characters_list = data.get("characters", [])
    rewatches_list = data.get("rewatches", [])

    imported = {"series": 0, "books": 0, "characters": 0, "rewatches": 0}

    with transaction.atomic():
        # 1. Series, Seasons & Movies
        for s in series_list:
            title = s.get("title")
            if not title:
                continue
            series, s_created = AnimeSeries.objects.get_or_create(
                title=title,
                defaults={
                    "japanese_title": s.get("japanese_title"),
                    "romaji_title": s.get("romaji_title"),
                },
            )
            if s_created:
                imported["series"] += 1

            for sea in s.get("seasons", []):
                season_num = sea.get("season_number", 1)
                season, _ = AnimeSeason.objects.get_or_create(
                    series=series,
                    season_number=season_num,
                    defaults={
                        "title": sea.get("title") or f"Season {season_num}",
                        "status": sea.get("status") or AnimeStatus.WATCHING,
                        "rating": sea.get("rating"),
                        "notes": sea.get("notes") or "",
                        "progress": sea.get("progress") or 0,
                        "total_episodes": sea.get("total_episodes"),
                    },
                )

            for mov in s.get("movies", []):
                m_title = mov.get("title")
                if not m_title:
                    continue
                AnimeMovie.objects.get_or_create(
                    series=series,
                    title=m_title,
                    defaults={
                        "status": mov.get("status") or AnimeStatus.WATCHING,
                        "rating": mov.get("rating"),
                        "notes": mov.get("notes") or "",
                        "progress_minutes": mov.get("progress_minutes") or 0,
                        "total_minutes": mov.get("total_minutes"),
                    },
                )

        # 2. Books
        for b in books_list:
            b_title = b.get("title")
            if not b_title:
                continue
            book, b_created = Book.objects.get_or_create(
                title=b_title,
                defaults={
                    "author": b.get("author"),
                    "status": b.get("status") or BookStatus.READING,
                    "rating": b.get("rating"),
                    "notes": b.get("notes") or "",
                    "progress": b.get("progress") or 0,
                    "total_pages": b.get("total_pages"),
                },
            )
            if b_created:
                imported["books"] += 1

        # 3. Characters
        for c in characters_list:
            c_name = c.get("name")
            if not c_name:
                continue
            series_obj = None
            series_ref = c.get("series")
            if isinstance(series_ref, dict) and series_ref.get("id"):
                series_obj = AnimeSeries.objects.filter(id=series_ref.get("id")).first()
            elif isinstance(series_ref, int):
                series_obj = AnimeSeries.objects.filter(id=series_ref).first()
            elif c.get("series_title"):
                series_obj = AnimeSeries.objects.filter(title__iexact=c.get("series_title")).first()

            if series_obj:
                _, c_created = FavoriteCharacter.objects.get_or_create(
                    series=series_obj,
                    name=c_name,
                    defaults={"why": c.get("why") or ""},
                )
                if c_created:
                    imported["characters"] += 1

        # 4. Rewatches
        for r in rewatches_list:
            target_obj = _resolve_rewatch_target(r)
            if target_obj:
                Rewatch.objects.create(
                    content_object=target_obj,
                    episode_number=r.get("episode_number"),
                    episode_title=r.get("episode_title"),
                    start_date=r.get("start_date"),
                    finish_date=r.get("finish_date") or r.get("start_date"),
                    rating=r.get("rating"),
                    notes=r.get("notes") or "",
                )
                imported["rewatches"] += 1

    return {"success": True, "imported": imported}
