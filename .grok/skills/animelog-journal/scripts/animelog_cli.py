#!/usr/bin/env python3
"""
AnimeLog CLI Companion: Portable Socratic Media Journal & Lookup Tool.

Dual-Mode Architecture:
1. Connected Mode: Connects to running AnimeLog server (http://127.0.0.1:8000/api)
2. Standalone Mode: Fully manages local journal (~/.animelog/journal.json) and Obsidian vault

Zero third-party dependencies (uses Python standard library only).
"""

import argparse
import datetime
import json
import os
import pathlib
import re
import sys
import urllib.parse
import urllib.request
from typing import Any, Optional

USER_AGENT = "AnimeLog-Companion-Skill/1.0"
DEFAULT_API_BASE = os.environ.get("ANIMELOG_API_BASE", "http://127.0.0.1:8000/api")
LOCAL_DIR = pathlib.Path.home() / ".animelog"
LOCAL_FILE = LOCAL_DIR / "journal.json"


def validate_rating(val: Optional[str]) -> Optional[int]:
    if val is None:
        return None
    try:
        num = int(val)
        if not (1 <= num <= 10):
            raise ValueError()
        return num
    except (ValueError, TypeError):
        raise argparse.ArgumentTypeError(f"Rating must be an integer between 1 and 10, got '{val}'.")


def format_blockquote(text: Optional[str], prefix: str = "> ") -> str:
    if not text:
        return ""
    lines = text.strip().splitlines()
    if not lines:
        return ""
    return "\n".join(f"{prefix}{line}" if line.strip() else prefix.rstrip() for line in lines)


def escape_yaml(val: Optional[str]) -> str:
    if not val:
        return '""'
    escaped = val.replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ")
    return f'"{escaped}"'


def sanitize_filename(title: str) -> str:
    cleaned = re.sub(r'[\\/*?:"<>|]', "", title).strip()
    return cleaned if cleaned else "Untitled"


def http_get_json(url: str, timeout: int = 10) -> Any:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def http_post_json(url: str, payload: dict, timeout: int = 10) -> dict:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"User-Agent": USER_AGENT, "Content-Type": "application/json", "Accept": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def is_backend_online() -> bool:
    try:
        req = urllib.request.Request(f"{DEFAULT_API_BASE}/stats/", headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=1.5) as resp:
            return resp.status == 200
    except Exception:
        return False


def load_local_journal() -> dict:
    LOCAL_DIR.mkdir(parents=True, exist_ok=True)
    if not LOCAL_FILE.exists():
        default_data = {
            "version": "1.0",
            "series": [],
            "books": [],
            "rewatches": [],
            "characters": [],
        }
        LOCAL_FILE.write_text(json.dumps(default_data, indent=2), encoding="utf-8")
        return default_data
    try:
        return json.loads(LOCAL_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {"version": "1.0", "series": [], "books": [], "rewatches": [], "characters": []}


def save_local_journal(data: dict) -> None:
    LOCAL_DIR.mkdir(parents=True, exist_ok=True)
    LOCAL_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")


# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------

def cmd_lookup_anime(args):
    q = args.query.strip()
    url = f"https://api.jikan.moe/v4/anime?q={urllib.parse.quote(q)}&limit={args.limit}"
    try:
        data = http_get_json(url)
        items = data.get("data", [])
        results = []
        for it in items:
            images = it.get("images", {}).get("jpg", {})
            cover = images.get("large_image_url") or images.get("image_url")
            results.append({
                "mal_id": it.get("mal_id"),
                "title": it.get("title"),
                "japanese_title": it.get("title_japanese"),
                "type": it.get("type"),
                "episodes": it.get("episodes"),
                "score": it.get("score"),
                "status": it.get("status"),
                "synopsis": (it.get("synopsis") or "")[:260],
                "studios": [s.get("name") for s in it.get("studios", [])],
                "genres": [g.get("name") for g in it.get("genres", [])],
                "cover_url": cover,
            })
        print(json.dumps({"source": "jikan_mal", "results": results}, indent=2))
    except Exception as e:
        print(json.dumps({"error": str(e), "results": []}))


def cmd_lookup_character(args):
    q = args.query.strip()
    url = f"https://api.jikan.moe/v4/characters?q={urllib.parse.quote(q)}&limit={args.limit}"
    try:
        data = http_get_json(url)
        items = data.get("data", [])
        results = []
        for it in items:
            images = it.get("images", {}).get("jpg", {})
            results.append({
                "mal_id": it.get("mal_id"),
                "name": it.get("name"),
                "name_kanji": it.get("name_kanji"),
                "about": (it.get("about") or "")[:260],
                "portrait_url": images.get("image_url"),
            })
        print(json.dumps({"source": "jikan_mal", "results": results}, indent=2))
    except Exception as e:
        print(json.dumps({"error": str(e), "results": []}))


def cmd_lookup_book(args):
    q = args.query.strip()
    url = f"https://openlibrary.org/search.json?q={urllib.parse.quote(q)}&limit={args.limit}"
    try:
        data = http_get_json(url)
        docs = data.get("docs", [])
        results = []
        for d in docs:
            authors = d.get("author_name") or []
            cover_id = d.get("cover_i")
            results.append({
                "key": d.get("key"),
                "title": d.get("title"),
                "author": authors[0] if authors else None,
                "total_pages": d.get("number_of_pages_median"),
                "genres": (d.get("subject") or [])[:5],
                "cover_url": f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg" if cover_id else None,
            })
        print(json.dumps({"source": "openlibrary", "results": results}, indent=2))
    except Exception as e:
        print(json.dumps({"error": str(e), "results": []}))


def cmd_status(args):
    if not args.offline and is_backend_online():
        try:
            stats = http_get_json(f"{DEFAULT_API_BASE}/stats/")
            print(json.dumps({"mode": "connected", "api_base": DEFAULT_API_BASE, "stats": stats}, indent=2))
            return
        except Exception:
            pass

    local_data = load_local_journal()
    stats = {
        "activeWatching": len([s for s in local_data.get("series", []) if any(sea.get("status") == "WATCHING" for sea in s.get("seasons", []))]),
        "activeReading": len([b for b in local_data.get("books", []) if b.get("status") == "READING"]),
        "totalCompleted": len([b for b in local_data.get("books", []) if b.get("status") == "COMPLETED"]),
        "totalSeries": len(local_data.get("series", [])),
        "totalBooks": len(local_data.get("books", [])),
        "totalRewatches": len(local_data.get("rewatches", [])),
        "totalCharacters": len(local_data.get("characters", [])),
    }
    print(json.dumps({"mode": "standalone_local", "local_file": str(LOCAL_FILE), "stats": stats}, indent=2))


def cmd_log_anime(args):
    title = args.title.strip()
    status_val = (args.status or "WATCHING").upper()
    rating = validate_rating(args.rating)
    notes = args.notes or ""

    if not args.offline and is_backend_online():
        try:
            payload = {
                "title": title,
                "genres": [],
                "initial_season": {
                    "title": "Season 1",
                    "season_number": 1,
                    "status": status_val,
                    "rating": rating,
                    "notes": notes,
                    "total_episodes": int(args.episodes) if args.episodes else None,
                    "progress": int(args.progress) if args.progress else (int(args.episodes) if status_val == "COMPLETED" and args.episodes else 0),
                },
            }
            res = http_post_json(f"{DEFAULT_API_BASE}/series/", payload)
            print(json.dumps({"success": True, "mode": "connected", "entry": res}, indent=2))
            return
        except Exception as e:
            if not args.fallback_local:
                print(f"[error] Backend request failed: {e}. Pass --fallback-local or --offline to store locally.", file=sys.stderr)
                sys.exit(1)
            print(f"[warning] Backend failed: {e}. Storing locally due to --fallback-local.", file=sys.stderr)

    local_data = load_local_journal()
    new_entry = {
        "id": int(datetime.datetime.now().timestamp() * 1000),
        "title": title,
        "created_at": datetime.date.today().isoformat(),
        "seasons": [
            {
                "id": 1,
                "season_number": 1,
                "title": "Season 1",
                "status": status_val,
                "progress": int(args.progress) if args.progress else 0,
                "total_episodes": int(args.episodes) if args.episodes else None,
                "rating": rating,
                "notes": notes,
                "episode_notes": [],
            }
        ],
        "movies": [],
    }
    local_data.setdefault("series", []).insert(0, new_entry)
    save_local_journal(local_data)
    print(json.dumps({"success": True, "mode": "standalone_local", "entry": new_entry}, indent=2))


def cmd_log_episode(args):
    series_title = args.series.strip()
    ep_num = int(args.episode)
    season_num = int(args.season or 1)
    rating = validate_rating(args.rating)
    note_text = args.note.strip()

    if not args.offline and is_backend_online():
        try:
            # Look up series to get season ID
            series_list = http_get_json(f"{DEFAULT_API_BASE}/series/?search={urllib.parse.quote(series_title)}")
            matching_series = next((s for s in series_list if s.get("title", "").lower() == series_title.lower()), None)
            if not matching_series and series_list:
                matching_series = series_list[0]

            if matching_series:
                season = next((sea for sea in matching_series.get("seasons", []) if sea.get("season_number") == season_num), None)
                if season:
                    payload = {
                        "season": season.get("id"),
                        "episode_number": ep_num,
                        "rating": rating,
                        "note": note_text,
                    }
                    res = http_post_json(f"{DEFAULT_API_BASE}/episode-notes/", payload)
                    print(json.dumps({"success": True, "mode": "connected", "entry": res}, indent=2))
                    return
        except Exception as e:
            if not args.fallback_local:
                print(f"[error] Backend request failed: {e}. Pass --fallback-local or --offline to store locally.", file=sys.stderr)
                sys.exit(1)
            print(f"[warning] Backend failed: {e}. Storing locally.", file=sys.stderr)

    local_data = load_local_journal()
    series_entry = next((s for s in local_data.get("series", []) if s.get("title", "").lower() == series_title.lower()), None)
    if not series_entry:
        # Create series entry if not present
        series_entry = {
            "id": int(datetime.datetime.now().timestamp() * 1000),
            "title": series_title,
            "created_at": datetime.date.today().isoformat(),
            "seasons": [{"id": 1, "season_number": season_num, "title": f"Season {season_num}", "status": "WATCHING", "episode_notes": []}],
        }
        local_data.setdefault("series", []).insert(0, series_entry)

    season_entry = next((sea for sea in series_entry.get("seasons", []) if sea.get("season_number") == season_num), None)
    if not season_entry:
        season_entry = {"id": len(series_entry.get("seasons", [])) + 1, "season_number": season_num, "title": f"Season {season_num}", "status": "WATCHING", "episode_notes": []}
        series_entry.setdefault("seasons", []).append(season_entry)

    ep_note = {
        "id": int(datetime.datetime.now().timestamp() * 1000),
        "episode_number": ep_num,
        "rating": rating,
        "note": note_text,
        "created_at": datetime.date.today().isoformat(),
    }
    season_entry.setdefault("episode_notes", []).append(ep_note)
    save_local_journal(local_data)
    print(json.dumps({"success": True, "mode": "standalone_local", "series": series_title, "episode_note": ep_note}, indent=2))


def cmd_log_rewatch(args):
    target = args.target.strip()
    rating = validate_rating(args.rating)
    notes = args.notes or ""
    date_val = args.date or datetime.date.today().isoformat()

    if not args.offline and is_backend_online():
        try:
            # Find content object
            series_list = http_get_json(f"{DEFAULT_API_BASE}/series/?search={urllib.parse.quote(target)}")
            match = next((s for s in series_list if s.get("title", "").lower() == target.lower()), None)
            if match:
                payload = {
                    "content_type": "animeseries",
                    "object_id": match.get("id"),
                    "start_date": date_val,
                    "finish_date": date_val,
                    "rating": rating,
                    "notes": notes,
                }
                res = http_post_json(f"{DEFAULT_API_BASE}/rewatches/", payload)
                print(json.dumps({"success": True, "mode": "connected", "entry": res}, indent=2))
                return
        except Exception as e:
            if not args.fallback_local:
                print(f"[error] Backend request failed: {e}. Pass --fallback-local or --offline to store locally.", file=sys.stderr)
                sys.exit(1)
            print(f"[warning] Backend failed: {e}. Storing locally.", file=sys.stderr)

    local_data = load_local_journal()
    new_rewatch = {
        "id": int(datetime.datetime.now().timestamp() * 1000),
        "release_title": target,
        "start_date": date_val,
        "rating": rating,
        "notes": notes,
    }
    local_data.setdefault("rewatches", []).insert(0, new_rewatch)
    save_local_journal(local_data)
    print(json.dumps({"success": True, "mode": "standalone_local", "rewatch": new_rewatch}, indent=2))


def cmd_log_character(args):
    name = args.name.strip()
    series_title = (args.series or "").strip()
    why = args.why.strip() if args.why else ""

    if not args.offline and is_backend_online():
        try:
            series_list = http_get_json(f"{DEFAULT_API_BASE}/series/?search={urllib.parse.quote(series_title)}")
            match = next((s for s in series_list if s.get("title", "").lower() == series_title.lower()), None)
            if not match and series_list:
                match = series_list[0]
            if match:
                payload = {
                    "series": match.get("id"),
                    "name": name,
                    "why": why,
                }
                res = http_post_json(f"{DEFAULT_API_BASE}/characters/", payload)
                print(json.dumps({"success": True, "mode": "connected", "entry": res}, indent=2))
                return
        except Exception as e:
            if not args.fallback_local:
                print(f"[error] Backend request failed: {e}. Pass --fallback-local or --offline to store locally.", file=sys.stderr)
                sys.exit(1)
            print(f"[warning] Backend failed: {e}. Storing locally.", file=sys.stderr)

    local_data = load_local_journal()
    new_char = {
        "id": int(datetime.datetime.now().timestamp() * 1000),
        "name": name,
        "series_title": series_title or "Independent Memory",
        "why": why,
    }
    local_data.setdefault("characters", []).insert(0, new_char)
    save_local_journal(local_data)
    print(json.dumps({"success": True, "mode": "standalone_local", "character": new_char}, indent=2))


def cmd_log_book(args):
    title = args.title.strip()
    status_val = (args.status or "READING").upper()
    rating = validate_rating(args.rating)
    notes = args.notes or ""

    if not args.offline and is_backend_online():
        try:
            payload = {
                "title": title,
                "author": args.author or None,
                "status": status_val,
                "rating": rating,
                "progress": int(args.progress) if args.progress else 0,
                "total_pages": int(args.pages) if args.pages else None,
                "notes": notes,
                "genres": [],
            }
            res = http_post_json(f"{DEFAULT_API_BASE}/books/", payload)
            print(json.dumps({"success": True, "mode": "connected", "entry": res}, indent=2))
            return
        except Exception as e:
            if not args.fallback_local:
                print(f"[error] Backend request failed: {e}. Pass --fallback-local or --offline to store locally.", file=sys.stderr)
                sys.exit(1)
            print(f"[warning] Backend failed: {e}. Storing locally.", file=sys.stderr)

    local_data = load_local_journal()
    new_entry = {
        "id": int(datetime.datetime.now().timestamp() * 1000),
        "title": title,
        "author": args.author or None,
        "status": status_val,
        "progress": int(args.progress) if args.progress else 0,
        "total_pages": int(args.pages) if args.pages else None,
        "rating": rating,
        "notes": notes,
        "created_at": datetime.date.today().isoformat(),
    }
    local_data.setdefault("books", []).insert(0, new_entry)
    save_local_journal(local_data)
    print(json.dumps({"success": True, "mode": "standalone_local", "entry": new_entry}, indent=2))


def cmd_search(args):
    q = args.query.lower().strip()
    matches = {"series": [], "books": [], "characters": [], "rewatches": []}

    local_data = load_local_journal()
    for s in local_data.get("series", []):
        matched = q in s.get("title", "").lower()
        matched_notes = []
        for sea in s.get("seasons", []):
            if q in sea.get("notes", "").lower():
                matched = True
                matched_notes.append(f"Season {sea.get('season_number')}: {sea.get('notes')}")
            for ep in sea.get("episode_notes", []):
                if q in ep.get("note", "").lower():
                    matched = True
                    matched_notes.append(f"Ep {ep.get('episode_number')}: {ep.get('note')}")
        if matched:
            matches["series"].append({"title": s.get("title"), "matched_notes": matched_notes})

    for b in local_data.get("books", []):
        if q in b.get("title", "").lower() or q in (b.get("author") or "").lower() or q in b.get("notes", "").lower():
            matches["books"].append({"title": b.get("title"), "author": b.get("author"), "notes": b.get("notes")})

    for c in local_data.get("characters", []):
        if q in c.get("name", "").lower() or q in c.get("why", "").lower() or q in c.get("series_title", "").lower():
            matches["characters"].append(c)

    for r in local_data.get("rewatches", []):
        if q in r.get("release_title", "").lower() or q in r.get("notes", "").lower():
            matches["rewatches"].append(r)

    print(json.dumps({"query": q, "results": matches}, indent=2))


def cmd_reflect(args):
    title = (args.title or "this story").strip()
    genre = (args.genre or "general").lower().strip()

    frameworks = {
        "shonen": [
            f"1. What conviction or ideal did the protagonist fight for in {title}, and where in your real life is that kind of perseverance needed?",
            f"2. Who was the most compelling rival or antagonist, and what valid point did they make that you usually resist acknowledging?",
            f"3. What was the true price of victory in {title}, and what does it tell you about the sacrifices required for meaningful goals?",
        ],
        "seinen": [
            f"1. What uncomfortable moral compromise or ambiguity in {title} made you hesitate, and how does it challenge black-and-white thinking in your world?",
            f"2. What did this story say about suffering: was it redemptive, corrupting, or simply endured?",
            f"3. In 5 years when you look back at {title}, what single hard-won perspective do you want to retain?",
        ],
        "slice-of-life": [
            f"1. What mundane, quiet interaction in {title} made ordinary life feel sacred or worth slowing down for?",
            f"2. How did the characters handle transition, seasonal change, or parting, and what does that teach about letting go?",
            f"3. What daily ritual or perspective from {title} could you practice tomorrow morning?",
        ],
        "general": [
            f"1. The Core Paradox: What truth about life or human nature did {title} demonstrate that sounds contradictory at first?",
            f"2. The Resonance: Which scene or choice lingered with you after the screen went dark, and why did it strike that specific nerve?",
            f"3. The Real-World Application: What belief or habit of yours should shift because you watched or read this?",
        ],
    }

    selected = frameworks.get(genre, frameworks["general"])
    print(f"\n=== Socratic Reflection Questions for {title} ({genre}) ===\n")
    for q in selected:
        print(f"{q}\n")
    print("Tip: Answer these questions thoughtfully, then run:")
    print(f'  python3 scripts/animelog_cli.py log-anime "{title}" --rating <1-10> --notes "<your synthesis>"')
    print("========================================================\n")


def cmd_export_obsidian(args):
    out_dir = pathlib.Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    today = datetime.date.today().isoformat()

    if not args.offline and is_backend_online():
        try:
            export_data = http_get_json(f"{DEFAULT_API_BASE}/export/?export_format=json")
            series_list = export_data.get("series", [])
            books_list = export_data.get("books", [])
            rewatches_list = export_data.get("rewatches", [])
            characters_list = export_data.get("characters", [])
        except Exception:
            local = load_local_journal()
            series_list = local.get("series", [])
            books_list = local.get("books", [])
            rewatches_list = local.get("rewatches", [])
            characters_list = local.get("characters", [])
    else:
        local = load_local_journal()
        series_list = local.get("series", [])
        books_list = local.get("books", [])
        rewatches_list = local.get("rewatches", [])
        characters_list = local.get("characters", [])

    created_files: list[str] = []
    seen_paths: dict[str, int] = {}

    def get_unique_path(base_dir: pathlib.Path, raw_name: str, ext: str = ".md") -> pathlib.Path:
        clean = sanitize_filename(raw_name)
        key = str(base_dir / clean).lower()
        if key not in seen_paths:
            seen_paths[key] = 1
            return base_dir / f"{clean}{ext}"
        seen_paths[key] += 1
        return base_dir / f"{clean} ({seen_paths[key]}){ext}"

    # 1. Write Anime Notes
    anime_folder = out_dir / "Anime"
    anime_folder.mkdir(parents=True, exist_ok=True)
    for s in series_list:
        file_path = get_unique_path(anime_folder, s.get("title", "Untitled"))
        title_val = s.get("title", "Untitled")
        lines = [
            "---",
            "type: anime-journal",
            f"title: {escape_yaml(title_val)}",
            f"japanese_title: {escape_yaml(s.get('japanese_title') or '')}",
            f"exported: {today}",
            "---",
            "",
            f"# {title_val}",
            "",
        ]
        genres = [g.get("name") if isinstance(g, dict) else str(g) for g in s.get("genres", [])]
        if genres:
            lines.append(f"**Genres:** {', '.join(genres)}\n")

        for sea in s.get("seasons", []):
            score_str = f" · Rating: {sea.get('rating')}/10" if sea.get("rating") else ""
            lines.append(f"## Season {sea.get('season_number', 1)}: {sea.get('title')} ({sea.get('status')}{score_str})")
            if sea.get("notes"):
                lines.append(f"\n{format_blockquote(sea.get('notes'))}\n")
            for ep in sea.get("episode_notes", []):
                ep_score = f" [{ep.get('rating')}/10]" if ep.get("rating") else ""
                lines.append(f"- **Ep {ep.get('episode_number')}{ep_score}:** {ep.get('note')}")

        for mov in s.get("movies", []):
            score_str = f" · Rating: {mov.get('rating')}/10" if mov.get("rating") else ""
            lines.append(f"\n## Film: {mov.get('title')} ({mov.get('status')}{score_str})")
            if mov.get("notes"):
                lines.append(f"\n{format_blockquote(mov.get('notes'))}\n")

        file_path.write_text("\n".join(lines), encoding="utf-8")
        created_files.append(str(file_path))

    # 2. Write Books Notes
    books_folder = out_dir / "Books"
    books_folder.mkdir(parents=True, exist_ok=True)
    for b in books_list:
        file_path = get_unique_path(books_folder, b.get("title", "Untitled"))
        title_val = b.get("title", "Untitled")
        lines = [
            "---",
            "type: book-journal",
            f"title: {escape_yaml(title_val)}",
            f"author: {escape_yaml(b.get('author') or '')}",
            f"status: {b.get('status')}",
            f"rating: {b.get('rating') or ''}",
            f"exported: {today}",
            "---",
            "",
            f"# {title_val}",
            f"**Author:** {b.get('author') or 'Unknown'}",
            f"**Progress:** {b.get('progress', 0)}/{b.get('total_pages') or '?'} pages",
            "",
        ]
        if b.get("notes"):
            lines.append(f"{format_blockquote(b.get('notes'))}\n")
        file_path.write_text("\n".join(lines), encoding="utf-8")
        created_files.append(str(file_path))

    # 3. Write Memorable Characters (with [[wikilinks]])
    chars_folder = out_dir / "Characters"
    chars_folder.mkdir(parents=True, exist_ok=True)
    for c in characters_list:
        char_name = c.get("name", "Unknown Character")
        file_path = get_unique_path(chars_folder, char_name)
        series_name = c.get("series_title") or (c.get("series", {}).get("title") if isinstance(c.get("series"), dict) else "Unknown Series")
        lines = [
            "---",
            "type: character-virtue",
            f"name: {escape_yaml(char_name)}",
            f"series: {escape_yaml(series_name)}",
            f"exported: {today}",
            "---",
            "",
            f"# {char_name}",
            f"**From:** [[{series_name}]]",
            "",
            "### Virtue & Why Remembered",
            f"{format_blockquote(c.get('why'))}\n",
        ]
        file_path.write_text("\n".join(lines), encoding="utf-8")
        created_files.append(str(file_path))

    # 4. Write Rewatches / Return Passes (with [[wikilinks]])
    rewatches_folder = out_dir / "Rewatches"
    rewatches_folder.mkdir(parents=True, exist_ok=True)
    for idx, r in enumerate(rewatches_list, 1):
        rel_title = r.get("release_title") or f"Pass {idx}"
        file_path = get_unique_path(rewatches_folder, f"{rel_title} - Pass {idx}")
        score_str = f"{r.get('rating')}/10" if r.get('rating') else "Unrated"
        lines = [
            "---",
            "type: rewatch-delta",
            f"title: {escape_yaml(rel_title)}",
            f"date: {r.get('start_date') or today}",
            f"rating: {r.get('rating') or ''}",
            "---",
            "",
            f"# Rewatch: [[{rel_title}]]",
            f"- **Date:** {r.get('start_date') or 'Undated'}",
            f"- **Rating:** {score_str}",
            "",
            "### Perspective Evolution / Reflection",
            f"{format_blockquote(r.get('notes'))}\n",
        ]
        file_path.write_text("\n".join(lines), encoding="utf-8")
        created_files.append(str(file_path))

    print(json.dumps({
        "success": True,
        "vault_path": str(out_dir),
        "exported": {
            "anime_count": len(series_list),
            "book_count": len(books_list),
            "rewatches_count": len(rewatches_list),
            "characters_count": len(characters_list),
            "total_files_written": len(created_files),
        }
    }, indent=2))


# ---------------------------------------------------------------------------
# Main CLI Router
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="AnimeLog Socratic Journal Companion CLI")
    parser.add_argument("--offline", action="store_true", help="Operate strictly on local storage (~/.animelog/journal.json)")
    parser.add_argument("--fallback-local", action="store_true", help="Fallback to local storage if backend connection fails")
    sub = parser.add_subparsers(dest="cmd", required=True)

    # lookup-anime
    p_la = sub.add_parser("lookup-anime", help="Search MyAnimeList via Jikan")
    p_la.add_argument("query", help="Anime title")
    p_la.add_argument("--limit", type=int, default=5, help="Max results")
    p_la.set_defaults(func=cmd_lookup_anime)

    # lookup-character
    p_lc = sub.add_parser("lookup-character", help="Search character via Jikan")
    p_lc.add_argument("query", help="Character name")
    p_lc.add_argument("--limit", type=int, default=5, help="Max results")
    p_lc.set_defaults(func=cmd_lookup_character)

    # lookup-book
    p_lb = sub.add_parser("lookup-book", help="Search book via OpenLibrary")
    p_lb.add_argument("query", help="Book title or author")
    p_lb.add_argument("--limit", type=int, default=5, help="Max results")
    p_lb.set_defaults(func=cmd_lookup_book)

    # status
    p_st = sub.add_parser("status", help="Get journal status and totals")
    p_st.set_defaults(func=cmd_status)

    # log-anime
    p_an = sub.add_parser("log-anime", help="Log an anime franchise")
    p_an.add_argument("title", help="Franchise title")
    p_an.add_argument("--status", default="WATCHING", choices=["WATCHING", "COMPLETED", "PLAN_TO_WATCH", "ON_HOLD", "DROPPED"])
    p_an.add_argument("--rating", type=int, choices=range(1, 11), help="Rating 1-10")
    p_an.add_argument("--episodes", type=int, help="Total episodes")
    p_an.add_argument("--progress", type=int, help="Current progress")
    p_an.add_argument("--notes", help="Life lesson / reflection note")
    p_an.set_defaults(func=cmd_log_anime)

    # log-episode
    p_ep = sub.add_parser("log-episode", help="Log a specific episode reflection note")
    p_ep.add_argument("series", help="Franchise title")
    p_ep.add_argument("episode", type=int, help="Episode number")
    p_ep.add_argument("--season", type=int, default=1, help="Season number (default: 1)")
    p_ep.add_argument("--rating", type=int, choices=range(1, 11), help="Episode score 1-10")
    p_ep.add_argument("--note", required=True, help="Episode reflection takeaway")
    p_ep.set_defaults(func=cmd_log_episode)

    # log-rewatch
    p_rw = sub.add_parser("log-rewatch", help="Log a rewatch pass and perspective evolution")
    p_rw.add_argument("target", help="Title of the series or film rewatched")
    p_rw.add_argument("--date", help="Date of rewatch (YYYY-MM-DD)")
    p_rw.add_argument("--rating", type=int, choices=range(1, 11), help="Score on this pass (1-10)")
    p_rw.add_argument("--notes", required=True, help="Rewatch perspective evolution note")
    p_rw.set_defaults(func=cmd_log_rewatch)

    # log-character
    p_ch = sub.add_parser("log-character", help="Catalog a memorable character virtue")
    p_ch.add_argument("name", help="Character name")
    p_ch.add_argument("--series", help="Franchise title")
    p_ch.add_argument("--why", required=True, help="Why this character is remembered (core virtue/lesson)")
    p_ch.set_defaults(func=cmd_log_character)

    # log-book
    p_bk = sub.add_parser("log-book", help="Log a book entry")
    p_bk.add_argument("title", help="Book title")
    p_bk.add_argument("--author", help="Author name")
    p_bk.add_argument("--status", default="READING", choices=["READING", "COMPLETED", "PLAN_TO_READ", "ON_HOLD", "DROPPED"])
    p_bk.add_argument("--rating", type=int, choices=range(1, 11), help="Rating 1-10")
    p_bk.add_argument("--pages", type=int, help="Total pages")
    p_bk.add_argument("--progress", type=int, help="Current page")
    p_bk.add_argument("--notes", help="Takeaway / philosophy note")
    p_bk.set_defaults(func=cmd_log_book)

    # search
    p_sr = sub.add_parser("search", help="Search journal across all titles, notes, and virtues")
    p_sr.add_argument("query", help="Search keyword")
    p_sr.set_defaults(func=cmd_search)

    # reflect
    p_rf = sub.add_parser("reflect", help="Generate Socratic reflection questions for a title")
    p_rf.add_argument("--title", help="Title of anime or book")
    p_rf.add_argument("--genre", choices=["shonen", "seinen", "slice-of-life", "general"], default="general", help="Genre framework")
    p_rf.set_defaults(func=cmd_reflect)

    # export-obsidian
    p_eo = sub.add_parser("export-obsidian", help="Export journal to Obsidian Markdown vault with [[wikilinks]]")
    p_eo.add_argument("--out", default="./animelog-vault", help="Output directory")
    p_eo.set_defaults(func=cmd_export_obsidian)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
