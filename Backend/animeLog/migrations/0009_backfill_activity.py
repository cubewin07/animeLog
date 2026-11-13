# Data migration to backfill historical ActivityEvent records from existing journal data.

from datetime import date, datetime, time, timezone as dt_timezone

from django.db import migrations
from django.utils import timezone


def _to_dt(value):
    if value is None:
        return timezone.now()
    if isinstance(value, datetime):
        if timezone.is_naive(value):
            return timezone.make_aware(value, dt_timezone.utc)
        return value
    if isinstance(value, date):
        return datetime.combine(value, time(12, 0), tzinfo=dt_timezone.utc)
    return timezone.now()


def backfill_activity_events(apps, schema_editor):
    ActivityEvent = apps.get_model("animeLog", "ActivityEvent")
    AnimeSeries = apps.get_model("animeLog", "AnimeSeries")
    AnimeSeason = apps.get_model("animeLog", "AnimeSeason")
    AnimeMovie = apps.get_model("animeLog", "AnimeMovie")
    EpisodeNote = apps.get_model("animeLog", "EpisodeNote")
    Rewatch = apps.get_model("animeLog", "Rewatch")
    FavoriteCharacter = apps.get_model("animeLog", "FavoriteCharacter")
    Book = apps.get_model("animeLog", "Book")
    ContentType = apps.get_model("contenttypes", "ContentType")

    events = []

    for season in AnimeSeason.objects.select_related("series").all():
        title = (f"{season.series.title} · {season.title}" if season.series_id else season.title)[:255]
        if season.progress > 0:
            events.append(
                ActivityEvent(
                    kind="EPISODE_PROGRESS",
                    target_type="season",
                    target_id=season.id,
                    title=title,
                    delta=season.progress,
                    backfilled=True,
                    created_at=_to_dt(season.start_date or season.created_at),
                )
            )
        if season.status == "COMPLETED":
            events.append(
                ActivityEvent(
                    kind="COMPLETED",
                    target_type="season",
                    target_id=season.id,
                    title=title,
                    delta=1,
                    backfilled=True,
                    created_at=_to_dt(season.finish_date or season.start_date or season.created_at),
                )
            )
        if (season.notes or "").strip():
            events.append(
                ActivityEvent(
                    kind="NOTE_WRITTEN",
                    target_type="season",
                    target_id=season.id,
                    title=title,
                    delta=1,
                    backfilled=True,
                    created_at=_to_dt(season.finish_date or season.start_date or season.created_at),
                )
            )

    for movie in AnimeMovie.objects.select_related("series").all():
        title = (f"{movie.series.title} · {movie.title}" if movie.series_id else movie.title)[:255]
        if movie.progress_minutes > 0:
            events.append(
                ActivityEvent(
                    kind="MOVIE_PROGRESS",
                    target_type="movie",
                    target_id=movie.id,
                    title=title,
                    delta=movie.progress_minutes,
                    backfilled=True,
                    created_at=_to_dt(movie.start_date or movie.created_at),
                )
            )
        if movie.status == "COMPLETED":
            events.append(
                ActivityEvent(
                    kind="COMPLETED",
                    target_type="movie",
                    target_id=movie.id,
                    title=title,
                    delta=1,
                    backfilled=True,
                    created_at=_to_dt(movie.finish_date or movie.start_date or movie.created_at),
                )
            )
        if (movie.notes or "").strip():
            events.append(
                ActivityEvent(
                    kind="NOTE_WRITTEN",
                    target_type="movie",
                    target_id=movie.id,
                    title=title,
                    delta=1,
                    backfilled=True,
                    created_at=_to_dt(movie.finish_date or movie.start_date or movie.created_at),
                )
            )

    for book in Book.objects.all():
        title = book.title[:255]
        if book.progress > 0:
            events.append(
                ActivityEvent(
                    kind="BOOK_PROGRESS",
                    target_type="book",
                    target_id=book.id,
                    title=title,
                    delta=book.progress,
                    backfilled=True,
                    created_at=_to_dt(book.start_date or book.created_at),
                )
            )
        if book.status == "COMPLETED":
            events.append(
                ActivityEvent(
                    kind="COMPLETED",
                    target_type="book",
                    target_id=book.id,
                    title=title,
                    delta=1,
                    backfilled=True,
                    created_at=_to_dt(book.finish_date or book.start_date or book.created_at),
                )
            )
        if (book.notes or "").strip():
            events.append(
                ActivityEvent(
                    kind="NOTE_WRITTEN",
                    target_type="book",
                    target_id=book.id,
                    title=title,
                    delta=1,
                    backfilled=True,
                    created_at=_to_dt(book.finish_date or book.start_date or book.created_at),
                )
            )

    for ep in EpisodeNote.objects.select_related("season__series").all():
        if (ep.note or "").strip():
            series_title = ep.season.series.title if ep.season_id and ep.season.series_id else ""
            prefix = f"{series_title} · " if series_title else ""
            events.append(
                ActivityEvent(
                    kind="NOTE_WRITTEN",
                    target_type="episode",
                    target_id=ep.season_id,
                    title=f"{prefix}Ep {ep.episode_number}"[:255],
                    delta=1,
                    backfilled=True,
                    created_at=_to_dt(ep.created_at),
                )
            )

    rewatches = list(Rewatch.objects.all())
    if rewatches:
        ct_map = {
            ct.id: ct.model.lower()
            for ct in ContentType.objects.filter(id__in={r.content_type_id for r in rewatches})
        }
        series_titles = dict(AnimeSeries.objects.values_list("id", "title"))
        season_info = {
            s.id: (s.series.title if s.series_id else "", s.title)
            for s in AnimeSeason.objects.select_related("series").all()
        }
        movie_info = {
            m.id: (m.series.title if m.series_id else "", m.title)
            for m in AnimeMovie.objects.select_related("series").all()
        }

        for r in rewatches:
            model_name = ct_map.get(r.content_type_id, "")
            if r.episode_number is not None:
                target_type = "episode"
            elif model_name == "animeseries":
                target_type = "series"
            elif model_name == "animeseason":
                target_type = "season"
            elif model_name == "animemovie":
                target_type = "movie"
            else:
                target_type = "rewatch"

            title = ""
            if model_name == "animeseries":
                title = series_titles.get(r.object_id, "")
            elif model_name == "animeseason":
                s_title, rel_title = season_info.get(r.object_id, ("", ""))
                title = s_title or rel_title
            elif model_name == "animemovie":
                s_title, rel_title = movie_info.get(r.object_id, ("", ""))
                title = s_title or rel_title

            events.append(
                ActivityEvent(
                    kind="REWATCH_LOGGED",
                    target_type=target_type,
                    target_id=r.object_id,
                    title=(title or "Rewatch")[:255],
                    delta=1,
                    backfilled=True,
                    created_at=_to_dt(r.start_date or r.finish_date or timezone.now()),
                )
            )

    for char in FavoriteCharacter.objects.select_related("series").all():
        created_ts = (char.series.created_at if char.series_id else None) or timezone.now()
        events.append(
            ActivityEvent(
                kind="CHARACTER_ADDED",
                target_type="character",
                target_id=char.id,
                title=char.name[:255],
                delta=1,
                backfilled=True,
                created_at=_to_dt(created_ts),
            )
        )

    if events:
        ActivityEvent.objects.bulk_create(events)


def reverse_backfill_activity_events(apps, schema_editor):
    ActivityEvent = apps.get_model("animeLog", "ActivityEvent")
    ActivityEvent.objects.filter(backfilled=True).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("animeLog", "0008_activityevent"),
    ]

    operations = [
        migrations.RunPython(backfill_activity_events, reverse_backfill_activity_events),
    ]
