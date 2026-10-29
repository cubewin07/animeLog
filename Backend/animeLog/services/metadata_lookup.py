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
from django.core.cache import cache
from django.core.files.base import ContentFile
from django.utils.text import slugify

from animeLog.models import Folder, Image

logger = logging.getLogger(__name__)

USER_AGENT = "AnimeLog-Journal/1.0 (https://github.com/cubewin07/animeLog)"
REQUEST_TIMEOUT = 12
CACHE_TTL_SECONDS = 86400  # 24 hours

ALLOWED_IMAGE_DOMAINS = {
    "cdn.myanimelist.net",
    "images.myanimelist.net",
    "myanimelist.net",
    "covers.openlibrary.org",
    "openlibrary.org",
}
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


class ExternalServiceError(Exception):
    """Raised when an external lookup provider fails or is unreachable."""

    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.status_code = status_code


def search_anime_metadata(query: str, limit: int = 8) -> list[dict[str, Any]]:
    """
    Search Jikan v4 API for anime series, films, and OVAs.
    Returns normalized metadata including titles, episode counts, studios, genres, and cover artwork.
    Results are cached for 24 hours.
    """
    clean_query = query.strip()
    if not clean_query:
        return []

    cache_key = f"animelog_lookup_anime_{slugify(clean_query)}_{limit}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    url = f"https://api.jikan.moe/v4/anime?q={urllib.parse.quote(clean_query)}&limit={max(1, min(limit, 25))}"
    try:
        response = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=REQUEST_TIMEOUT)
    except Exception as exc:
        logger.warning("Failed to connect to Jikan API for '%s': %s", clean_query, exc)
        raise ExternalServiceError(f"Unable to connect to MyAnimeList/Jikan: {exc}")

    if response.status_code == 429:
        raise ExternalServiceError("MyAnimeList/Jikan rate limit reached. Please wait a few seconds and try again.", 429)
    if response.status_code != 200:
        logger.warning("Jikan API error %s: %s", response.status_code, response.text[:200])
        raise ExternalServiceError(f"MyAnimeList/Jikan returned error {response.status_code}.", 502)

    try:
        data = response.json().get("data", [])
    except Exception as exc:
        logger.warning("Failed to parse Jikan response: %s", exc)
        raise ExternalServiceError("Invalid response received from MyAnimeList/Jikan.", 502)

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

    cache.set(cache_key, results, CACHE_TTL_SECONDS)
    return results


def search_character_metadata(query: str, limit: int = 8) -> list[dict[str, Any]]:
    """
    Search Jikan v4 API for memorable characters.
    Results are cached for 24 hours.
    """
    clean_query = query.strip()
    if not clean_query:
        return []

    cache_key = f"animelog_lookup_char_{slugify(clean_query)}_{limit}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    url = f"https://api.jikan.moe/v4/characters?q={urllib.parse.quote(clean_query)}&limit={max(1, min(limit, 25))}"
    try:
        response = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=REQUEST_TIMEOUT)
    except Exception as exc:
        logger.warning("Failed to connect to Jikan character API for '%s': %s", clean_query, exc)
        raise ExternalServiceError(f"Unable to connect to MyAnimeList/Jikan: {exc}")

    if response.status_code == 429:
        raise ExternalServiceError("MyAnimeList/Jikan rate limit reached. Please wait a few seconds and try again.", 429)
    if response.status_code != 200:
        logger.warning("Jikan character API error %s: %s", response.status_code, response.text[:200])
        raise ExternalServiceError(f"MyAnimeList/Jikan returned error {response.status_code}.", 502)

    try:
        data = response.json().get("data", [])
    except Exception as exc:
        logger.warning("Failed to parse Jikan character response: %s", exc)
        raise ExternalServiceError("Invalid character response received from MyAnimeList/Jikan.", 502)

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

    cache.set(cache_key, results, CACHE_TTL_SECONDS)
    return results


def search_book_metadata(query: str, limit: int = 8) -> list[dict[str, Any]]:
    """
    Search OpenLibrary API for books and literature.
    Results are cached for 24 hours.
    """
    clean_query = query.strip()
    if not clean_query:
        return []

    cache_key = f"animelog_lookup_book_{slugify(clean_query)}_{limit}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    url = f"https://openlibrary.org/search.json?q={urllib.parse.quote(clean_query)}&limit={max(1, min(limit, 25))}"
    try:
        response = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=REQUEST_TIMEOUT)
    except Exception as exc:
        logger.warning("Failed to connect to OpenLibrary for '%s': %s", clean_query, exc)
        raise ExternalServiceError(f"Unable to connect to OpenLibrary: {exc}")

    if response.status_code != 200:
        logger.warning("OpenLibrary API error %s", response.status_code)
        raise ExternalServiceError(f"OpenLibrary returned error {response.status_code}.", 502)

    try:
        docs = response.json().get("docs", [])
    except Exception as exc:
        logger.warning("Failed to parse OpenLibrary response: %s", exc)
        raise ExternalServiceError("Invalid response received from OpenLibrary.", 502)

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

    cache.set(cache_key, results, CACHE_TTL_SECONDS)
    return results


def import_remote_image(
    url: str,
    title: str = "",
    folder_name: str = "Imported Media",
) -> Image:
    """
    Download a remote image file and save it into the Image library.
    Ensures URL safety (SSRF whitelist), size limit (max 5 MB), and deduplication.
    """
    clean_url = url.strip()
    if not clean_url:
        raise ValueError("Image URL cannot be empty.")

    parsed = urllib.parse.urlparse(clean_url)
    if parsed.scheme not in ("http", "https"):
        raise ValueError("Invalid URL scheme. Only HTTP and HTTPS are supported.")

    hostname = (parsed.hostname or "").lower()
    is_allowed = any(
        hostname == domain or hostname.endswith("." + domain)
        for domain in ALLOWED_IMAGE_DOMAINS
    )
    if not is_allowed:
        raise ValueError(
            f"Domain '{hostname}' is not in the trusted image sources allowlist ({', '.join(sorted(ALLOWED_IMAGE_DOMAINS))})."
        )

    clean_title = title.strip()
    folder, _ = Folder.objects.get_or_create(
        name=folder_name.strip() or "Imported Media",
        parent=None,
    )

    # Deduplication check: if an image with this title already exists in the folder, reuse it
    if clean_title:
        existing = Image.objects.filter(folder=folder, title=clean_title).first()
        if existing:
            return existing

    try:
        resp = requests.get(
            clean_url,
            headers={"User-Agent": USER_AGENT},
            timeout=15,
            stream=True,
        )
    except Exception as exc:
        raise RuntimeError(f"Failed to connect to image host: {exc}")

    if resp.status_code != 200:
        raise RuntimeError(f"Failed to download image from {clean_url}: HTTP {resp.status_code}")

    content_length = resp.headers.get("Content-Length")
    if content_length:
        try:
            if int(content_length) > MAX_IMAGE_SIZE_BYTES:
                raise ValueError(f"Remote image size exceeds 5 MB limit ({content_length} bytes).")
        except (ValueError, TypeError):
            pass

    content_chunks = []
    total_downloaded = 0
    for chunk in resp.iter_content(chunk_size=65536):
        if chunk:
            total_downloaded += len(chunk)
            if total_downloaded > MAX_IMAGE_SIZE_BYTES:
                raise ValueError("Remote image exceeded 5 MB limit during streaming download.")
            content_chunks.append(chunk)

    raw_bytes = b"".join(content_chunks)
    if not raw_bytes:
        raise RuntimeError("Downloaded image is empty.")

    # Determine file extension from content-type or url
    content_type = resp.headers.get("Content-Type", "").lower()
    ext = ".jpg"
    if "png" in content_type:
        ext = ".png"
    elif "webp" in content_type:
        ext = ".webp"
    elif "gif" in content_type:
        ext = ".gif"
    elif "jpeg" in content_type or "jpg" in content_type:
        ext = ".jpg"
    else:
        path = urllib.parse.urlparse(clean_url).path
        _, url_ext = os.path.splitext(path)
        if url_ext:
            ext = url_ext.lower()

    slug = slugify(clean_title)[:40] if clean_title else "asset"
    filename = f"{slug}_{os.urandom(4).hex()}{ext}"

    image = Image.objects.create(
        file=ContentFile(raw_bytes, name=filename),
        title=clean_title or filename,
        alt_text=f"Cover art for {clean_title}" if clean_title else None,
        folder=folder,
    )
    return image
