"""
Activity tracking service for AnimeLog progression and streak history.
"""

from datetime import date, datetime, time, timezone as dt_timezone

from django.utils import timezone

from animeLog.models import (
    ActivityEvent,
    ActivityKind,
    AnimeMovie,
    AnimeSeason,
    AnimeStatus,
    Book,
    BookStatus,
    EpisodeNote,
    FavoriteCharacter,
    Rewatch,
)


def _coerce_timestamp(value: datetime | date | None) -> datetime:
    if value is None:
        return timezone.now()
    if isinstance(value, datetime):
        if timezone.is_naive(value):
            return timezone.make_aware(value, dt_timezone.utc)
        return value
    if isinstance(value, date):
        return datetime.combine(value, time(12, 0), tzinfo=dt_timezone.utc)
    return value


def record_activity(
    kind: str,
    target_type: str,
    target_id: int,
    title: str,
    delta: int = 1,
    created_at: datetime | date | None = None,
    backfilled: bool = False,
) -> ActivityEvent:
    """Create and persist an ActivityEvent record."""
    return ActivityEvent.objects.create(
        kind=kind,
        target_type=target_type,
        target_id=target_id,
        title=(title or "")[:255],
        delta=delta,
        backfilled=backfilled,
        created_at=_coerce_timestamp(created_at),
    )


def release_activity_title(release: AnimeSeason | AnimeMovie) -> str:
    """Format a human-readable title for a season or movie activity event."""
    if release.series_id:
        return f"{release.series.title} · {release.title}"
    return release.title


def record_release_activity(
    release: AnimeSeason | AnimeMovie,
    *,
    prev_progress: int = 0,
    prev_status: str = "",
    prev_notes: str = "",
    progress_delta: int | None = None,
) -> None:
    """Record progress, completion, and note events for an AnimeSeason or AnimeMovie."""
    is_season = isinstance(release, AnimeSeason)
    target_type = "season" if is_season else "movie"
    progress_kind = ActivityKind.EPISODE_PROGRESS if is_season else ActivityKind.MOVIE_PROGRESS
    current_progress = release.progress if is_season else release.progress_minutes
    delta = progress_delta if progress_delta is not None else (current_progress - prev_progress)
    title = release_activity_title(release)

    if prev_status == AnimeStatus.COMPLETED and release.status != AnimeStatus.COMPLETED:
        record_activity(ActivityKind.COMPLETED, target_type, release.id, title, delta=-1)

    if delta != 0:
        record_activity(progress_kind, target_type, release.id, title, delta=delta)

    if prev_status != AnimeStatus.COMPLETED and release.status == AnimeStatus.COMPLETED:
        record_activity(ActivityKind.COMPLETED, target_type, release.id, title, delta=1)

    new_notes = (release.notes or "").strip()
    old_notes = (prev_notes or "").strip()
    if new_notes and new_notes != old_notes:
        record_activity(ActivityKind.NOTE_WRITTEN, target_type, release.id, title, delta=1)


def record_book_activity(
    book: Book,
    *,
    prev_progress: int = 0,
    prev_status: str = "",
    prev_notes: str = "",
    progress_delta: int | None = None,
) -> None:
    """Record progress, completion, and note events for a Book."""
    if prev_status == BookStatus.COMPLETED and book.status != BookStatus.COMPLETED:
        record_activity(ActivityKind.COMPLETED, "book", book.id, book.title, delta=-1)

    if progress_delta is not None:
        if progress_delta != 0:
            record_activity(
                ActivityKind.BOOK_PROGRESS,
                "book",
                book.id,
                book.title,
                delta=progress_delta,
            )
    elif book.progress > prev_progress:
        record_activity(
            ActivityKind.BOOK_PROGRESS,
            "book",
            book.id,
            book.title,
            delta=book.progress - prev_progress,
        )

    if prev_status != BookStatus.COMPLETED and book.status == BookStatus.COMPLETED:
        record_activity(ActivityKind.COMPLETED, "book", book.id, book.title, delta=1)

    new_notes = (book.notes or "").strip()
    old_notes = (prev_notes or "").strip()
    if new_notes and new_notes != old_notes:
        record_activity(ActivityKind.NOTE_WRITTEN, "book", book.id, book.title, delta=1)


def record_episode_note_activity(
    ep_note: EpisodeNote,
    *,
    prev_note: str = "",
) -> None:
    """Record a NOTE_WRITTEN event when an episode note is created or its note text changes."""
    new_note = (ep_note.note or "").strip()
    old_note = (prev_note or "").strip()
    if new_note and new_note != old_note:
        series_title = ep_note.season.series.title if ep_note.season_id and ep_note.season.series_id else ""
        prefix = f"{series_title} · " if series_title else ""
        record_activity(
            ActivityKind.NOTE_WRITTEN,
            "episode",
            ep_note.season_id,
            f"{prefix}Ep {ep_note.episode_number}",
            delta=1,
        )


def record_rewatch_activity(rewatch: Rewatch) -> None:
    """Record a REWATCH_LOGGED event for a newly logged Rewatch."""
    title = rewatch.series_title or rewatch.release_title or "Rewatch"
    record_activity(
        ActivityKind.REWATCH_LOGGED,
        rewatch.target_type or "rewatch",
        rewatch.object_id,
        title,
        delta=1,
    )


def record_character_activity(
    character: FavoriteCharacter,
    *,
    created: bool = False,
    prev_why: str = "",
) -> None:
    """Record a CHARACTER_ADDED event on creation or when `why` is newly written/updated."""
    new_why = (character.why or "").strip()
    old_why = (prev_why or "").strip()
    if created or (new_why and new_why != old_why):
        record_activity(
            ActivityKind.CHARACTER_ADDED,
            "character",
            character.id,
            character.name,
            delta=1,
        )
