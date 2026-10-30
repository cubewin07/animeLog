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

            season, _ = AnimeSeason.objects.get_or_create(
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
            if not created:
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
        # 1. Series & Seasons
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
            r_notes = r.get("notes") or ""
            target_title = r.get("release_title")
            if target_title:
                match_series = AnimeSeries.objects.filter(title__iexact=target_title).first()
                if match_series:
                    Rewatch.objects.create(
                        content_object=match_series,
                        start_date=r.get("start_date"),
                        finish_date=r.get("finish_date") or r.get("start_date"),
                        rating=r.get("rating"),
                        notes=r_notes,
                    )
                    imported["rewatches"] += 1

    return {"success": True, "imported": imported}
