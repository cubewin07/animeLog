from datetime import date
from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.db.models import Q
from django.db.models.functions import Length, Trim
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    AnimeMovie,
    AnimeSeason,
    AnimeSeries,
    AnimeStatus,
    Book,
    BookStatus,
    EpisodeNote,
    FavoriteCharacter,
    Folder,
    Genre,
    Image,
    Rewatch,
    Studio,
)
from .serializers import (
    AnimeMovieSerializer,
    AnimeSeasonSerializer,
    AnimeSeriesSerializer,
    BookSerializer,
    EpisodeNoteSerializer,
    FavoriteCharacterSerializer,
    FolderSerializer,
    GenreSerializer,
    ImageSerializer,
    JournalStatsSerializer,
    RewatchSerializer,
    StudioSerializer,
)


def _update_release_progress(
    viewset,
    request,
    pk,
    *,
    model,
    progress_field,
    total_field,
    response_field,
    total_label,
):
    delta = request.data.get("delta")
    if delta is None or isinstance(delta, bool) or not isinstance(delta, int):
        return Response(
            {"delta": "A valid integer delta is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    with transaction.atomic():
        release = get_object_or_404(model.objects.select_for_update(), pk=pk)
        current_progress = getattr(release, progress_field)
        total = getattr(release, total_field)
        new_progress = current_progress + delta

        if new_progress < 0:
            return Response(
                {response_field: "Progress cannot be negative."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if total is not None and new_progress > total:
            return Response(
                {
                    response_field: (
                        f"Progress ({new_progress}) cannot exceed {total_label} ({total})."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        setattr(release, progress_field, new_progress)
        changed_fields = [progress_field]

        if release.status == AnimeStatus.PLAN_TO_WATCH and new_progress > 0:
            release.status = AnimeStatus.WATCHING
            changed_fields.append("status")

        if total is not None and new_progress >= total and release.status == AnimeStatus.WATCHING:
            release.status = AnimeStatus.COMPLETED
            changed_fields.append("status")
            if not release.finish_date:
                release.finish_date = date.today()
                changed_fields.append("finish_date")

        release.save(update_fields=list(dict.fromkeys(changed_fields)))

    return Response(viewset.get_serializer(release).data, status=status.HTTP_200_OK)


class FolderViewSet(viewsets.ModelViewSet):
    queryset = Folder.objects.select_related("parent").all().order_by("name")
    serializer_class = FolderSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        parent_param = self.request.query_params.get("parent")
        if parent_param:
            if parent_param.lower() in ("null", "none", "root"):
                queryset = queryset.filter(parent__isnull=True)
            elif parent_param.isdigit():
                queryset = queryset.filter(parent_id=int(parent_param))
        return queryset


class ImageViewSet(viewsets.ModelViewSet):
    queryset = Image.objects.select_related("folder").all().order_by("-created_at")
    serializer_class = ImageSerializer

    @action(detail=False, methods=["post"], url_path="import-url")
    def import_url(self, request):
        url = request.data.get("url")
        if not url:
            return Response(
                {"url": "Image URL is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        title = request.data.get("title", "")
        folder_name = request.data.get("folder", "Imported Media")
        try:
            from .services.metadata_lookup import import_remote_image

            image = import_remote_image(url=url, title=title, folder_name=folder_name)
            return Response(self.get_serializer(image).data, status=status.HTTP_201_CREATED)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    def get_queryset(self):
        queryset = super().get_queryset()
        folder_param = self.request.query_params.get("folder")
        if folder_param:
            if folder_param.lower() in ("null", "none", "root"):
                queryset = queryset.filter(folder__isnull=True)
            elif folder_param.isdigit():
                queryset = queryset.filter(folder_id=int(folder_param))

        search_param = self.request.query_params.get("search")
        if search_param:
            queryset = queryset.filter(
                Q(title__icontains=search_param)
                | Q(alt_text__icontains=search_param)
                | Q(file__icontains=search_param)
            )

        return queryset


class GenreViewSet(viewsets.ModelViewSet):
    queryset = Genre.objects.all()
    serializer_class = GenreSerializer


class StudioViewSet(viewsets.ModelViewSet):
    queryset = Studio.objects.all()
    serializer_class = StudioSerializer


class SeriesViewSet(viewsets.ModelViewSet):
    serializer_class = AnimeSeriesSerializer

    def get_queryset(self):
        queryset = (
            AnimeSeries.objects.select_related("cover_image")
            .prefetch_related(
                "genres",
                "favorite_characters__cover_image",
                "favorite_characters__images",
                "rewatches",
                "seasons__studios",
                "seasons__cover_image",
                "seasons__episode_notes__cover_image",
                "seasons__episode_notes__rewatches",
                "seasons__rewatches",
                "movies__studios",
                "movies__cover_image",
                "movies__rewatches",
            )
            .all()
            .order_by("-created_at")
        )

        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(
                Q(seasons__status=status_param) | Q(movies__status=status_param)
            )

        search_param = self.request.query_params.get("search")
        if search_param:
            queryset = queryset.filter(
                Q(title__icontains=search_param)
                | Q(seasons__notes__icontains=search_param)
                | Q(movies__notes__icontains=search_param)
                | Q(favorite_characters__name__icontains=search_param)
                | Q(favorite_characters__why__icontains=search_param)
            )

        genre_param = self.request.query_params.get("genre")
        if genre_param:
            if genre_param.isdigit():
                queryset = queryset.filter(genres__id=int(genre_param))
            else:
                queryset = queryset.filter(genres__name__iexact=genre_param)

        return queryset.distinct()


class SeasonViewSet(viewsets.ModelViewSet):
    serializer_class = AnimeSeasonSerializer

    def get_queryset(self):
        queryset = (
            AnimeSeason.objects.select_related("series", "cover_image")
            .prefetch_related(
                "studios",
                "episode_notes__cover_image",
                "episode_notes__rewatches",
                "rewatches",
            )
            .all()
            .order_by("season_number", "id")
        )

        series_param = self.request.query_params.get("series")
        if series_param and series_param.isdigit():
            queryset = queryset.filter(series_id=int(series_param))

        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)

        search_param = self.request.query_params.get("search")
        if search_param:
            queryset = queryset.filter(
                Q(title__icontains=search_param)
                | Q(notes__icontains=search_param)
                | Q(series__title__icontains=search_param)
            )

        return queryset.distinct()

    @action(detail=True, methods=["patch"], url_path="progress")
    def progress(self, request, pk=None):
        return _update_release_progress(
            self,
            request,
            pk,
            model=AnimeSeason,
            progress_field="progress",
            total_field="total_episodes",
            response_field="progress",
            total_label="total episodes",
        )


class MovieViewSet(viewsets.ModelViewSet):
    serializer_class = AnimeMovieSerializer

    def get_queryset(self):
        queryset = (
            AnimeMovie.objects.select_related("series", "cover_image")
            .prefetch_related(
                "studios",
                "rewatches",
            )
            .all()
            .order_by("created_at", "id")
        )

        series_param = self.request.query_params.get("series")
        if series_param and series_param.isdigit():
            queryset = queryset.filter(series_id=int(series_param))

        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)

        search_param = self.request.query_params.get("search")
        if search_param:
            queryset = queryset.filter(
                Q(title__icontains=search_param)
                | Q(notes__icontains=search_param)
                | Q(series__title__icontains=search_param)
            )

        return queryset.distinct()

    @action(detail=True, methods=["patch"], url_path="progress")
    def progress(self, request, pk=None):
        return _update_release_progress(
            self,
            request,
            pk,
            model=AnimeMovie,
            progress_field="progress_minutes",
            total_field="total_minutes",
            response_field="progress_minutes",
            total_label="total minutes",
        )


class EpisodeNoteViewSet(viewsets.ModelViewSet):
    serializer_class = EpisodeNoteSerializer

    def get_queryset(self):
        queryset = (
            EpisodeNote.objects.select_related("season", "season__series", "cover_image")
            .prefetch_related("rewatches")
            .all()
            .order_by("episode_number", "id")
        )
        season_param = self.request.query_params.get("season")
        if season_param and season_param.isdigit():
            queryset = queryset.filter(season_id=int(season_param))

        search_param = self.request.query_params.get("search")
        if search_param:
            queryset = queryset.filter(
                Q(note__icontains=search_param)
                | Q(episode_title__icontains=search_param)
                | Q(season__title__icontains=search_param)
            )

        return queryset


class RewatchViewSet(viewsets.ModelViewSet):
    serializer_class = RewatchSerializer

    def get_queryset(self):
        queryset = (
            Rewatch.objects.select_related("content_type")
            .prefetch_related("content_object")
            .all()
            .order_by("-start_date", "-id")
        )

        target_type_param = self.request.query_params.get("target_type")
        target_id_param = self.request.query_params.get("target_id")
        if target_type_param:
            t_norm = target_type_param.lower().strip()
            if t_norm == "episode":
                queryset = queryset.filter(episode_number__isnull=False)
            elif t_norm == "season":
                queryset = queryset.filter(content_type__model="animeseason", episode_number__isnull=True)
            elif t_norm == "movie":
                queryset = queryset.filter(content_type__model="animemovie")
            elif t_norm == "series":
                queryset = queryset.filter(content_type__model="animeseries")

        if target_id_param and target_id_param.isdigit():
            queryset = queryset.filter(object_id=int(target_id_param))

        season_param = self.request.query_params.get("season")
        if season_param and season_param.isdigit():
            queryset = queryset.filter(
                content_type__model="animeseason", object_id=int(season_param)
            )

        movie_param = self.request.query_params.get("movie")
        if movie_param and movie_param.isdigit():
            queryset = queryset.filter(
                content_type__model="animemovie", object_id=int(movie_param)
            )

        episode_param = self.request.query_params.get("episode")
        if episode_param and episode_param.isdigit():
            queryset = queryset.filter(
                content_type__model="animeseason", episode_number=int(episode_param)
            )

        series_param = self.request.query_params.get("series")
        if series_param and series_param.isdigit():
            s_id = int(series_param)
            season_ids = list(
                AnimeSeason.objects.filter(series_id=s_id).values_list("id", flat=True)
            )
            movie_ids = list(
                AnimeMovie.objects.filter(series_id=s_id).values_list("id", flat=True)
            )

            series_ct = ContentType.objects.get_for_model(AnimeSeries)
            season_ct = ContentType.objects.get_for_model(AnimeSeason)
            movie_ct = ContentType.objects.get_for_model(AnimeMovie)

            q = Q(content_type=series_ct, object_id=s_id)
            if season_ids:
                q |= Q(content_type=season_ct, object_id__in=season_ids)
            if movie_ids:
                q |= Q(content_type=movie_ct, object_id__in=movie_ids)

            queryset = queryset.filter(q)

        search_param = self.request.query_params.get("search")
        if search_param:
            queryset = queryset.filter(notes__icontains=search_param)

        return queryset


class FavoriteCharacterViewSet(viewsets.ModelViewSet):
    serializer_class = FavoriteCharacterSerializer

    def get_queryset(self):
        queryset = (
            FavoriteCharacter.objects.select_related("series", "cover_image")
            .prefetch_related("images")
            .all()
            .order_by("name")
        )

        series_param = self.request.query_params.get("series")
        if series_param and series_param.isdigit():
            queryset = queryset.filter(series_id=int(series_param))

        search_param = self.request.query_params.get("search")
        if search_param:
            queryset = queryset.filter(
                Q(name__icontains=search_param)
                | Q(why__icontains=search_param)
                | Q(series__title__icontains=search_param)
            )

        return queryset


class BookViewSet(viewsets.ModelViewSet):
    serializer_class = BookSerializer

    def get_queryset(self):
        queryset = (
            Book.objects.select_related("cover_image")
            .prefetch_related("genres")
            .all()
            .order_by("-created_at")
        )

        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)

        search_param = self.request.query_params.get("search")
        if search_param:
            queryset = queryset.filter(
                Q(title__icontains=search_param)
                | Q(author__icontains=search_param)
                | Q(notes__icontains=search_param)
            )

        genre_param = self.request.query_params.get("genre")
        if genre_param:
            if genre_param.isdigit():
                queryset = queryset.filter(genres__id=int(genre_param))
            else:
                queryset = queryset.filter(genres__name__iexact=genre_param)

        return queryset.distinct()


def _count_written_lessons(queryset, field_name="notes"):
    return (
        queryset.annotate(_notes_len=Length(Trim(field_name)))
        .filter(_notes_len__gt=0)
        .count()
    )


class StatsView(APIView):
    """
    Returns aggregated journal counts for the dashboard overview.
    """

    def get(self, request):
        active_watching = (
            AnimeSeason.objects.filter(status=AnimeStatus.WATCHING).count()
            + AnimeMovie.objects.filter(status=AnimeStatus.WATCHING).count()
        )
        active_reading = Book.objects.filter(status=BookStatus.READING).count()

        completed_seasons = AnimeSeason.objects.filter(
            status=AnimeStatus.COMPLETED
        ).count()
        completed_movies = AnimeMovie.objects.filter(
            status=AnimeStatus.COMPLETED
        ).count()
        completed_books = Book.objects.filter(status=BookStatus.COMPLETED).count()

        season_lessons = _count_written_lessons(AnimeSeason.objects.all(), "notes")
        movie_lessons = _count_written_lessons(AnimeMovie.objects.all(), "notes")
        episode_lessons = _count_written_lessons(EpisodeNote.objects.all(), "note")
        rewatch_lessons = _count_written_lessons(Rewatch.objects.all(), "notes")
        book_lessons = _count_written_lessons(Book.objects.all(), "notes")

        rewatches_count = Rewatch.objects.count()
        characters_count = FavoriteCharacter.objects.count()

        data = {
            "activeWatching": active_watching,
            "activeReading": active_reading,
            "totalCompleted": completed_seasons + completed_movies + completed_books,
            "totalLessons": (
                season_lessons
                + movie_lessons
                + episode_lessons
                + rewatch_lessons
                + book_lessons
            ),
            "rewatchesCount": rewatches_count,
            "charactersCount": characters_count,
        }

        serializer = JournalStatsSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class MetadataLookupView(APIView):
    """
    Unified metadata lookup against Jikan (MyAnimeList) and OpenLibrary.
    Query params:
      - type: 'anime', 'character', or 'book'
      - q: Search string
    """

    def get(self, request):
        from .services.metadata_lookup import (
            search_anime_metadata,
            search_book_metadata,
            search_character_metadata,
        )

        media_type = request.query_params.get("type", "anime").lower().strip()
        query = request.query_params.get("q", "").strip()
        if not query:
            return Response({"results": []}, status=status.HTTP_200_OK)

        if media_type == "anime":
            results = search_anime_metadata(query)
        elif media_type == "character":
            results = search_character_metadata(query)
        elif media_type == "book":
            results = search_book_metadata(query)
        else:
            return Response(
                {"error": f"Invalid type '{media_type}'. Must be 'anime', 'character', or 'book'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({"results": results}, status=status.HTTP_200_OK)


class JournalExportView(APIView):
    """
    Export the full personal journal in JSON or Obsidian-ready Markdown.
    Query params:
      - format: 'json' (default) or 'markdown'
    """

    def get(self, request):
        export_format = (
            request.query_params.get("export_format")
            or request.query_params.get("format_type")
            or request.query_params.get("style")
            or "json"
        ).lower().strip()
        series_qs = (
            AnimeSeries.objects.select_related("cover_image")
            .prefetch_related(
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
        books_qs = (
            Book.objects.select_related("cover_image")
            .prefetch_related("genres")
            .all()
            .order_by("-created_at")
        )
        rewatches_qs = Rewatch.objects.all().order_by("-start_date", "-id")
        characters_qs = (
            FavoriteCharacter.objects.select_related("series")
            .all()
            .order_by("name")
        )

        if export_format == "markdown":
            md_lines = [
                "---",
                "title: AnimeLog Personal Journal Export",
                f"exported_at: {date.today().isoformat()}",
                "generator: AnimeLog Still & Spine",
                "---",
                "",
                "# AnimeLog Personal Journal",
                "",
                "## Anime Franchises",
                "",
            ]
            for s in series_qs:
                md_lines.append(f"### {s.title}")
                if s.japanese_title or s.romaji_title:
                    md_lines.append(
                        f"*{s.japanese_title or ''} / {s.romaji_title or ''}*"
                    )
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
                        md_lines.append(f"> {season.notes}\n")
                    for ep in season.episode_notes.all():
                        ep_score = f" [{ep.rating}/10]" if ep.rating else ""
                        md_lines.append(
                            f"- **Ep {ep.episode_number}{ep_score}:** {ep.note}"
                        )
                for movie in s.movies.all():
                    score_str = f" · Rating: {movie.rating}/10" if movie.rating else ""
                    md_lines.append(
                        f"\n#### Film: {movie.title} ({movie.status}{score_str})"
                    )
                    if movie.notes:
                        md_lines.append(f"> {movie.notes}\n")
                md_lines.append("")

            md_lines.append("## Literature & Books\n")
            for b in books_qs:
                b_score = f" · Rating: {b.rating}/10" if b.rating else ""
                md_lines.append(
                    f"### {b.title} by {b.author or 'Unknown'} ({b.status}{b_score})"
                )
                md_lines.append(
                    f"- Progress: {b.progress}/{b.total_pages or '?'} pages"
                )
                if b.notes:
                    md_lines.append(f"> {b.notes}\n")

            md_lines.append("## Rewatches & Return Passes\n")
            for r in rewatches_qs:
                r_score = f" · Rating: {r.rating}/10" if r.rating else ""
                md_lines.append(
                    f"- **{r.release_title}** ({r.start_date or 'Undated'}{r_score})"
                )
                if r.notes:
                    md_lines.append(f"  > {r.notes}")

            md_lines.append("\n## Memorable Characters & Virtues\n")
            for c in characters_qs:
                md_lines.append(f"- **{c.name}** ({c.series_title})")
                if c.why:
                    md_lines.append(f"  *“{c.why}”*")

            markdown_text = "\n".join(md_lines)
            return Response(
                {"content": markdown_text, "format": "markdown"},
                status=status.HTTP_200_OK,
            )

        # JSON format
        series_data = AnimeSeriesSerializer(series_qs, many=True).data
        books_data = BookSerializer(books_qs, many=True).data
        rewatches_data = RewatchSerializer(rewatches_qs, many=True).data
        characters_data = FavoriteCharacterSerializer(characters_qs, many=True).data

        return Response(
            {
                "version": "1.0",
                "exported_at": date.today().isoformat(),
                "series": series_data,
                "books": books_data,
                "rewatches": rewatches_data,
                "characters": characters_data,
            },
            status=status.HTTP_200_OK,
        )
