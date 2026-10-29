"""
External metadata lookup and remote asset ingestion service.

Integrates with:
- Jikan v4 API (unofficial MyAnimeList REST API, no key required) for Anime & Characters
- OpenLibrary Search API (no key required) for Books
- Remote image download into the local/Cloudinary Image library
"""

import logging
import os
import re
import urllib.parse
from typing import Any
import requests
from django.core.files.base import ContentFile
from django.utils.text import slugify

from animeLog.models import Folder, Image

logger = logging.getLogger(__name__)

USER_AGENT = "AnimeLog-Journal/1.0 (https://github.com/cubewin07/animeLog)"
REQUEST_TIMEOUT = 12


def search_anime_metadata(query: str, limit: int = 8) -> list[dict[str, Any]]:
    """
    Search Jikan v4 API for anime series, films, and OVAs.
    Returns normalized metadata including titles, episode counts, studios, genres, and cover artwork.
    """
    clean_query = query.strip()
    if not clean_query:
        return []

    url = f"https://api.jikan.moe/v4/anime?q={urllib.parse.quote(clean_query)}&limit={max(1, min(limit, 25))}"
    try:
        response = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=REQUEST_TIMEOUT)
        if response.status_code != 200:
            logger.warning("Jikan API error %s: %s", response.status_code, response.text[:200])
            return []
        data = response.json().get("data", [])
    except Exception as exc:
        logger.warning("Failed to fetch anime metadata for '%s': %s", clean_query, exc)
        return []

    results = []
    for item in data:
        images_dict = item.get("images", {}).get("jpg", {})
        cover_url = images_dict.get("large_image_url") or images_dict.get("image_url") or ""

        # Find Romaji title if different
        romaji_title = None
        for t_info in item.get("titles", []):
            if t_info.get("type") in ("Romaji", "Default") and t_info.get("title") != item.get("title"):
                romaji_title = t_info.get("title")
                break

        # Extract duration in minutes if movie/special
        duration_str = item.get("duration") or ""
        total_minutes = None
        min_match = re.search(r"(\d+)\s*hr[s]?\s*(\d+)?\s*min", duration_str, re.I)
        if min_match:
            hrs = int(min_match.group(1))
            mins = int(min_match.group(2) or 0)
            total_minutes = hrs * 60 + mins
        else:
            only_mins = re.search(r"(\d+)\s*min", duration_str, re.I)
            if only_mins:
                total_minutes = int(only_mins.group(1))

        media_type = str(item.get("type") or "TV").upper()
        results.append({
            "source": "mal",
            "source_id": item.get("mal_id"),
            "title": item.get("title") or "",
            "japanese_title": item.get("title_japanese") or None,
            "romaji_title": romaji_title,
            "media_type": "movie" if media_type == "MOVIE" else "season",
            "format": media_type,
            "total_episodes": item.get("episodes"),
            "total_minutes": total_minutes,
            "score": item.get("score"),
            "status": item.get("status"),
            "synopsis": (item.get("synopsis") or "").strip(),
            "studios": [s.get("name") for s in item.get("studios", []) if s.get("name")],
            "genres": [g.get("name") for g in item.get("genres", []) if g.get("name")],
            "cover_url": cover_url,
        })

    return results


def search_character_metadata(query: str, limit: int = 8) -> list[dict[str, Any]]:
    """
    Search Jikan v4 API for memorable characters.
    """
    clean_query = query.strip()
    if not clean_query:
        return []

    url = f"https://api.jikan.moe/v4/characters?q={urllib.parse.quote(clean_query)}&limit={max(1, min(limit, 25))}"
    try:
        response = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=REQUEST_TIMEOUT)
        if response.status_code != 200:
            logger.warning("Jikan character API error %s: %s", response.status_code, response.text[:200])
            return []
        data = response.json().get("data", [])
    except Exception as exc:
        logger.warning("Failed to fetch character metadata for '%s': %s", clean_query, exc)
        return []

    results = []
    for item in data:
        images_dict = item.get("images", {}).get("jpg", {})
        portrait_url = images_dict.get("image_url") or ""

        results.append({
            "source": "mal",
            "source_id": item.get("mal_id"),
            "name": item.get("name") or "",
            "name_kanji": item.get("name_kanji") or None,
            "about": (item.get("about") or "").strip(),
            "portrait_url": portrait_url,
        })

    return results


def search_book_metadata(query: str, limit: int = 8) -> list[dict[str, Any]]:
    """
    Search OpenLibrary API for books and literature.
    """
    clean_query = query.strip()
    if not clean_query:
        return []

    url = f"https://openlibrary.org/search.json?q={urllib.parse.quote(clean_query)}&limit={max(1, min(limit, 25))}"
    try:
        response = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=REQUEST_TIMEOUT)
        if response.status_code != 200:
            logger.warning("OpenLibrary API error %s", response.status_code)
            return []
        docs = response.json().get("docs", [])
    except Exception as exc:
        logger.warning("Failed to fetch book metadata for '%s': %s", clean_query, exc)
        return []

    results = []
    for doc in docs:
        authors = doc.get("author_name") or []
        author_str = authors[0] if authors else None
        cover_id = doc.get("cover_i")
        cover_url = f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg" if cover_id else ""

        results.append({
            "source": "openlibrary",
            "key": doc.get("key"),
            "title": doc.get("title") or "",
            "author": author_str,
            "total_pages": doc.get("number_of_pages_median") or None,
            "genres": (doc.get("subject") or [])[:5],
            "first_publish_year": doc.get("first_publish_year"),
            "cover_url": cover_url,
        })

    return results


def import_remote_image(
    url: str,
    title: str = "",
    folder_name: str = "Imported Media",
) -> Image:
    """
    Download a remote image file and save it into the Image library.
    Ensures a target folder exists and assigns proper naming.
    """
    clean_url = url.strip()
    if not clean_url:
        raise ValueError("Image URL cannot be empty.")

    resp = requests.get(
        clean_url,
        headers={"User-Agent": USER_AGENT},
        timeout=15,
    )
    if resp.status_code != 200 or not resp.content:
        raise RuntimeError(f"Failed to download image from {clean_url}: HTTP {resp.status_code}")

    # Determine file extension from content-type or url
    content_type = resp.headers.get("Content-Type", "")
    ext = ".jpg"
    if "png" in content_type:
        ext = ".png"
    elif "webp" in content_type:
        ext = ".webp"
    elif "jpeg" in content_type:
        ext = ".jpg"
    else:
        path = urllib.parse.urlparse(clean_url).path
        _, url_ext = os.path.splitext(path)
        if url_ext:
            ext = url_ext.lower()

    slug = slugify(title)[:40] if title else "asset"
    filename = f"{slug}_{os.urandom(4).hex()}{ext}"

    folder, _ = Folder.objects.get_or_create(
        name=folder_name.strip() or "Imported Media",
        parent=None,
    )

    image = Image.objects.create(
        file=ContentFile(resp.content, name=filename),
        title=title.strip() or filename,
        alt_text=f"Cover art for {title}" if title else None,
        folder=folder,
    )
    return image
