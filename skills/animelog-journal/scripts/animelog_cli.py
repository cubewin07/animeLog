#!/usr/bin/env python3
"""
AnimeLog CLI Companion: Portable Socratic Media Journal & Lookup Tool.

Dual-Mode Architecture:
1. Connected Mode: Connects to running AnimeLog server (http://127.0.0.1:8000/api)
2. Standalone Mode: Falls back to local ~/.animelog/journal.json and Obsidian vault

Zero third-party dependencies (uses Python standard library only).
"""

import argparse
import datetime
import json
import os
import pathlib
import sys
import urllib.parse
import urllib.request

USER_AGENT = "AnimeLog-Companion-Skill/1.0"
DEFAULT_API_BASE = os.environ.get("ANIMELOG_API_BASE", "http://127.0.0.1:8000/api")
LOCAL_DIR = pathlib.Path.home() / ".animelog"
LOCAL_FILE = LOCAL_DIR / "journal.json"


def http_get_json(url: str, timeout: int = 10) -> dict | list:
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
    online = is_backend_online()
    if online:
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
    rating = int(args.rating) if args.rating else None
    notes = args.notes or ""

    if is_backend_online():
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
            print(f"[warning] Backend failed: {e}. Falling back to local storage.", file=sys.stderr)

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
            }
        ],
    }
    local_data.setdefault("series", []).insert(0, new_entry)
    save_local_journal(local_data)
    print(json.dumps({"success": True, "mode": "standalone_local", "entry": new_entry}, indent=2))


def cmd_log_book(args):
    title = args.title.strip()
    status_val = (args.status or "READING").upper()
    rating = int(args.rating) if args.rating else None
    notes = args.notes or ""

    if is_backend_online():
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
            print(f"[warning] Backend failed: {e}. Falling back to local storage.", file=sys.stderr)

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


def cmd_export_obsidian(args):
    out_dir = pathlib.Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    today = datetime.date.today().isoformat()

    if is_backend_online():
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

    # Write Anime Notes
    anime_folder = out_dir / "Anime"
    anime_folder.mkdir(parents=True, exist_ok=True)
    for s in series_list:
        clean_title = "".join(c for c in s.get("title", "Untitled") if c not in r'\/:*?"<>|')
        file_path = anime_folder / f"{clean_title}.md"
        lines = [
            "---",
            "type: anime-journal",
            f"title: \"{s.get('title')}\"",
            f"japanese_title: \"{s.get('japanese_title') or ''}\"",
            f"exported: {today}",
            "---",
            "",
            f"# {s.get('title')}",
            "",
        ]
        for sea in s.get("seasons", []):
            lines.append(f"## Season {sea.get('season_number', 1)}: {sea.get('title')} ({sea.get('status')})")
            if sea.get("rating"):
                lines.append(f"**Score:** {sea.get('rating')}/10")
            if sea.get("notes"):
                lines.append(f"\n> {sea.get('notes')}\n")
        file_path.write_text("\n".join(lines), encoding="utf-8")

    # Write Books Notes
    books_folder = out_dir / "Books"
    books_folder.mkdir(parents=True, exist_ok=True)
    for b in books_list:
        clean_title = "".join(c for c in b.get("title", "Untitled") if c not in r'\/:*?"<>|')
        file_path = books_folder / f"{clean_title}.md"
        lines = [
            "---",
            "type: book-journal",
            f"title: \"{b.get('title')}\"",
            f"author: \"{b.get('author') or ''}\"",
            f"status: {b.get('status')}",
            f"rating: {b.get('rating') or ''}",
            "---",
            "",
            f"# {b.get('title')}",
            f"**Author:** {b.get('author') or 'Unknown'}",
            "",
        ]
        if b.get("notes"):
            lines.append(f"> {b.get('notes')}\n")
        file_path.write_text("\n".join(lines), encoding="utf-8")

    print(json.dumps({
        "success": True,
        "vault_path": str(out_dir),
        "exported": {
            "anime_count": len(series_list),
            "book_count": len(books_list),
            "rewatches_count": len(rewatches_list),
            "characters_count": len(characters_list),
        }
    }, indent=2))


# ---------------------------------------------------------------------------
# Main CLI Router
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="AnimeLog Socratic Journal Companion CLI")
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
    p_an.add_argument("--rating", type=int, help="Rating 1-10")
    p_an.add_argument("--episodes", type=int, help="Total episodes")
    p_an.add_argument("--progress", type=int, help="Current progress")
    p_an.add_argument("--notes", help="Life lesson / reflection note")
    p_an.set_defaults(func=cmd_log_anime)

    # log-book
    p_bk = sub.add_parser("log-book", help="Log a book entry")
    p_bk.add_argument("title", help="Book title")
    p_bk.add_argument("--author", help="Author name")
    p_bk.add_argument("--status", default="READING", choices=["READING", "COMPLETED", "PLAN_TO_READ", "ON_HOLD", "DROPPED"])
    p_bk.add_argument("--rating", type=int, help="Rating 1-10")
    p_bk.add_argument("--pages", type=int, help="Total pages")
    p_bk.add_argument("--progress", type=int, help="Current page")
    p_bk.add_argument("--notes", help="Takeaway / philosophy note")
    p_bk.set_defaults(func=cmd_log_book)

    # export-obsidian
    p_eo = sub.add_parser("export-obsidian", help="Export journal to Obsidian Markdown vault")
    p_eo.add_argument("--out", default="./animelog-vault", help="Output directory")
    p_eo.set_defaults(func=cmd_export_obsidian)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
