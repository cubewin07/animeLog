"""
Export service for AnimeLog personal journal.

Generates:
1. Unified Obsidian-ready single-document Markdown with YAML frontmatter,
   proper multi-line blockquotes, and [[wikilinks]].
2. Multi-file Obsidian vault structure for archive/zip downloads.
"""

from datetime import date
from typing import Optional
from django.db.models import QuerySet
from animeLog.models import AnimeSeries, Book, Rewatch, FavoriteCharacter


def format_blockquote(text: Optional[str], prefix: str = "> ") -> str:
    """
    Format multi-line notes into valid Markdown blockquotes where every line
    retains the blockquote prefix.
    """
    if not text:
        return ""
    lines = text.strip().splitlines()
    if not lines:
        return ""
    return "\n".join(f"{prefix}{line}" if line.strip() else prefix.rstrip() for line in lines)


def escape_yaml_string(val: Optional[str]) -> str:
    """
    Safely escape a string for YAML double-quoted frontmatter values.
    """
    if not val:
        return '""'
    escaped = val.replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ")
    return f'"{escaped}"'


def generate_journal_markdown(
    series_qs: Optional[QuerySet] = None,
    books_qs: Optional[QuerySet] = None,
    rewatches_qs: Optional[QuerySet] = None,
    characters_qs: Optional[QuerySet] = None,
) -> str:
    """
    Generate unified Obsidian-ready Markdown export of the entire journal.
    Includes proper [[wikilinks]] connecting series, characters, and rewatches.
    """
    if series_qs is None:
        series_qs = (
            AnimeSeries.objects.prefetch_related(
                "genres",
                "seasons__studios",
                "seasons__episode_notes",
                "movies__studios",
                "favorite_characters",
                "rewatches",
            )
            .all()
            .order_by("-created_at")
        )
    if books_qs is None:
        books_qs = (
            Book.objects.select_related("cover_image")
            .prefetch_related("genres")
            .all()
            .order_by("-created_at")
        )
    if rewatches_qs is None:
        rewatches_qs = Rewatch.objects.all().order_by("-start_date", "-id")
    if characters_qs is None:
        characters_qs = (
            FavoriteCharacter.objects.select_related("series")
            .all()
            .order_by("name")
        )

    today_str = date.today().isoformat()
    md_lines = [
        "---",
        "title: AnimeLog Personal Journal Export",
        f"exported_at: {today_str}",
        "generator: AnimeLog Still & Spine",
        "obsidian_compat: true",
        "---",
        "",
        "# AnimeLog Personal Journal",
        "",
        "## Anime Franchises",
        "",
    ]

    for s in series_qs:
        md_lines.append(f"### [[{s.title}]]")
        if s.japanese_title or s.romaji_title:
            sub = " / ".join(filter(None, [s.japanese_title, s.romaji_title]))
            md_lines.append(f"*{sub}*")

        genres_str = ", ".join([g.name for g in s.genres.all()])
        if genres_str:
            md_lines.append(f"- **Genres:** {genres_str}")

        for season in s.seasons.all():
            score_str = f" · Rating: {season.rating}/10" if season.rating else ""
            md_lines.append(
                f"\n#### Season {season.season_number}: {season.title} ({season.status}{score_str})"
            )
            md_lines.append(
                f"- Progress: {season.progress}/{season.total_episodes or '?'}"
            )
            if season.notes:
                md_lines.append(f"\n{format_blockquote(season.notes)}\n")

            for ep in season.episode_notes.all():
                ep_score = f" [{ep.rating}/10]" if ep.rating else ""
                ep_quote = f"\n{format_blockquote(ep.note, prefix='    > ')}" if "\n" in ep.note else f": {ep.note}"
                md_lines.append(f"- **Ep {ep.episode_number}{ep_score}**{ep_quote}")

        for movie in s.movies.all():
            score_str = f" · Rating: {movie.rating}/10" if movie.rating else ""
            md_lines.append(
                f"\n#### Film: {movie.title} ({movie.status}{score_str})"
            )
            if movie.notes:
                md_lines.append(f"\n{format_blockquote(movie.notes)}\n")

        md_lines.append("")

    md_lines.append("## Literature & Books\n")
    for b in books_qs:
        b_score = f" · Rating: {b.rating}/10" if b.rating else ""
        md_lines.append(
            f"### [[{b.title}]] by {b.author or 'Unknown'} ({b.status}{b_score})"
        )
        md_lines.append(
            f"- Progress: {b.progress}/{b.total_pages or '?'} pages"
        )
        if b.notes:
            md_lines.append(f"\n{format_blockquote(b.notes)}\n")

    md_lines.append("## Rewatches & Return Passes\n")
    for r in rewatches_qs:
        r_score = f" · Rating: {r.rating}/10" if r.rating else ""
        target_link = f"[[{r.release_title}]]" if r.release_title else "Unknown Release"
        md_lines.append(
            f"- **{target_link}** ({r.start_date or 'Undated'}{r_score})"
        )
        if r.notes:
            md_lines.append(f"{format_blockquote(r.notes, prefix='    > ')}")

    md_lines.append("\n## Memorable Characters & Virtues\n")
    for c in characters_qs:
        series_link = f"[[{c.series.title}]]" if c.series else "Unknown Series"
        md_lines.append(f"- **{c.name}** ({series_link})")
        if c.why:
            md_lines.append(f"{format_blockquote(c.why, prefix='    > ')}")

    return "\n".join(md_lines)
