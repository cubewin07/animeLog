from datetime import date
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
                "favorite_characters__images",
                "seasons__studios",
                "seasons__cover_image",
                "seasons__episode_notes__cover_image",
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
            Rewatch.objects.select_related("season", "movie", "season__series", "movie__series")
            .all()
            .order_by("-start_date", "-id")
        )

        season_param = self.request.query_params.get("season")
        if season_param and season_param.isdigit():
            queryset = queryset.filter(season_id=int(season_param))

        movie_param = self.request.query_params.get("movie")
        if movie_param and movie_param.isdigit():
            queryset = queryset.filter(movie_id=int(movie_param))

        series_param = self.request.query_params.get("series")
        if series_param and series_param.isdigit():
            s_id = int(series_param)
            queryset = queryset.filter(
                Q(season__series_id=s_id) | Q(movie__series_id=s_id)
            )

        return queryset


class FavoriteCharacterViewSet(viewsets.ModelViewSet):
    serializer_class = FavoriteCharacterSerializer

    def get_queryset(self):
        queryset = (
            FavoriteCharacter.objects.select_related("series")
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
